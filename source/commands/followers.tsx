import React from 'react';
import {Text, Box} from 'ink';
import {Alert, Spinner} from '@inkjs/ui';
import zod from 'zod';
import {argument, option} from 'pastel';
import {useInstagramClient} from '../ui/hooks/use-instagram-client.js';
import type {FollowerAnalysis, FollowerUser} from '../types/instagram.js';
import AltScreen from '../ui/components/full-screen.js';
import {StatsDisplay} from '../ui/components/stats-display.js';
import {UnfollowInteractive} from '../ui/components/unfollow-interactive.js';

export const args = zod.tuple([
	zod
		.enum(['stats', 'analyze', 'export', 'unfollow'])
		.optional()
		.describe(
			argument({
				name: 'action',
				description:
					'Action to perform: stats (show counts), analyze (find fake friends), export (save to JSON), unfollow (interactive unfollow)',
			}),
		),
]);

export const options = zod.object({
	username: zod
		.string()
		.optional()
		.describe(
			option({
				description: 'Instagram username to use (defaults to current user)',
				alias: 'u',
			}),
		),
	inactiveDays: zod
		.number()
		.optional()
		.default(90)
		.describe(
			option({
				description: 'Days since last post to consider inactive (default: 90)',
				alias: 'd',
			}),
		),
	maxUsers: zod
		.number()
		.optional()
		.default(100)
		.describe(
			option({
				description: 'Maximum users to analyze (default: 100)',
				alias: 'm',
			}),
		),
	output: zod
		.string()
		.optional()
		.describe(
			option({
				description: 'Output file path for JSON export',
				alias: 'o',
			}),
		),
	noActivity: zod
		.boolean()
		.optional()
		.default(false)
		.describe(
			option({
				description: 'Skip activity checks (faster but less accurate)',
			}),
		),
	inactiveOnly: zod
		.boolean()
		.optional()
		.default(false)
		.describe(
			option({
				description:
					'Show/export only inactive accounts (no recent posts/stories)',
			}),
		),
	sortBy: zod
		.enum(['score', 'inactive', 'posts'])
		.optional()
		.default('score')
		.describe(
			option({
				description:
					'Sort results by: score (suspicion), inactive (days since post), posts (post count)',
			}),
		),
	groupBy: zod
		.enum(['none', 'verified', 'follower-count', 'mutual'])
		.optional()
		.default('none')
		.describe(
			option({
				description:
					'Group results by: none, verified (verified status), follower-count (popularity tiers), mutual (relationship type)',
			}),
		),
	interactive: zod
		.boolean()
		.optional()
		.default(false)
		.describe(
			option({
				description:
					'Enable interactive mode with checkboxes for selection (for unfollow)',
				alias: 'i',
			}),
		),
	confirmUnfollow: zod
		.boolean()
		.optional()
		.default(true)
		.describe(
			option({
				description: 'Require confirmation before unfollowing (default: true)',
			}),
		),
});

type Properties = {
	readonly args: zod.infer<typeof args>;
	readonly options: zod.infer<typeof options>;
};

export default function Followers({args, options}: Properties) {
	const action = args[0] ?? 'stats';
	const {
		client,
		isLoading,
		error: clientError,
	} = useInstagramClient(options.username);

	const [result, setResult] = React.useState<string | undefined>(undefined);
	const [error, setError] = React.useState<string | undefined>(undefined);
	const [analysis, setAnalysis] = React.useState<
		FollowerAnalysis[] | undefined
	>(undefined);

	// For stats display
	const [statsData, setStatsData] = React.useState<
		| {
				followers: FollowerUser[];
				following: FollowerUser[];
				mutualFollows: FollowerUser[];
				notFollowingBack: FollowerUser[];
				notFollowedBack: FollowerUser[];
				currentUser: {username?: string};
		  }
		| undefined
	>(undefined);

	// For unfollow interactive mode
	const [showUnfollowUI, setShowUnfollowUI] = React.useState(false);
	const [unfollowCandidates, setUnfollowCandidates] = React.useState<
		FollowerUser[]
	>([]);

	React.useEffect(() => {
		if (!client || isLoading) {
			return;
		}

		(async () => {
			try {
				switch (action) {
					case 'stats': {
						const [followers, following, currentUser] = await Promise.all([
							client.getFollowersList(),
							client.getFollowingList(),
							client.getCurrentUser(),
						]);

						const followerPks = new Set(followers.map(f => f.pk));
						const followingPks = new Set(following.map(f => f.pk));

						// Get mutual follows (users in both lists)
						const mutualFollows = followers.filter(f => followingPks.has(f.pk));

						// Get users you follow but they don't follow back
						const notFollowingBack = following.filter(
							f => !followerPks.has(f.pk),
						);

						// Get users who follow you but you don't follow back
						const notFollowedBack = followers.filter(
							f => !followingPks.has(f.pk),
						);

						// Store stats data for rendering
						setStatsData({
							followers,
							following,
							mutualFollows,
							notFollowingBack,
							notFollowedBack,
							currentUser: currentUser ?? {username: undefined},
						});

						break;
					}

					case 'unfollow': {
						setResult('📋 Loading accounts for unfollow...');

						const [followers, following] = await Promise.all([
							client.getFollowersList(),
							client.getFollowingList(),
						]);

						const followerPks = new Set(followers.map(f => f.pk));

						// By default, show accounts you follow but they don't follow back
						const candidates = following.filter(f => !followerPks.has(f.pk));

						if (candidates.length === 0) {
							setResult('✅ No non-mutual follows found!');
							break;
						}

						setUnfollowCandidates(candidates);
						setShowUnfollowUI(true);
						setResult(undefined);

						break;
					}

					case 'analyze': {
						setResult(
							'🔍 Analyzing your following list...\nThis may take a while.',
						);

						let analysisResult = await client.analyzeFollowing({
							inactiveDays: options.inactiveDays,
							checkActivity: !options.noActivity,
							maxUsers: options.maxUsers,
						});

						// Filter to inactive only if requested
						if (options.inactiveOnly) {
							analysisResult = analysisResult.filter(
								a => a.activity.isInactive,
							);
						}

						// Sort results based on user preference
						if (options.sortBy === 'inactive') {
							analysisResult.sort(
								(a, b) =>
									(b.activity.daysSinceLastPost ?? 0) -
									(a.activity.daysSinceLastPost ?? 0),
							);
						} else if (options.sortBy === 'posts') {
							analysisResult.sort(
								(a, b) => a.user.mediaCount - b.user.mediaCount,
							);
						} else {
							// Default: sort by suspicion score
							analysisResult.sort(
								(a, b) => b.suspicionScore - a.suspicionScore,
							);
						}

						setAnalysis(analysisResult);

						const suspiciousUsers = analysisResult.filter(
							a => a.suspicionScore > 0,
						);

						const inactiveUsers = analysisResult.filter(
							a => a.activity.isInactive,
						);

						let output = `\n🕵️  Analysis Complete!\n\n`;
						output += `Analyzed ${analysisResult.length} users\n`;

						if (options.inactiveOnly) {
							output += `Found ${inactiveUsers.length} inactive accounts (no posts in ${options.inactiveDays}+ days)\n\n`;
						} else {
							output += `Found ${suspiciousUsers.length} potentially fake friends\n`;
							output += `Found ${inactiveUsers.length} inactive accounts\n\n`;
						}

						if (
							(options.inactiveOnly && inactiveUsers.length > 0) ||
							(!options.inactiveOnly && suspiciousUsers.length > 0)
						) {
							const displayUsers = options.inactiveOnly
								? analysisResult.slice(0, 20)
								: suspiciousUsers.slice(0, 20);

							output += options.inactiveOnly
								? `📅 Inactive accounts (sorted by ${options.sortBy}):\n\n`
								: `🚩 Top suspicious accounts:\n\n`;

							for (const item of displayUsers) {
								output += `@${item.user.username} (Score: ${item.suspicionScore})`;

								if (item.activity.daysSinceLastPost !== undefined) {
									output += ` - ${item.activity.daysSinceLastPost} days inactive`;
								}

								output += '\n';
								output += `  Full name: ${item.user.fullName}\n`;
								output += `  Posts: ${item.user.mediaCount}, Followers: ${item.user.followerCount}, Following: ${item.user.followingCount}\n`;

								// Show profile quality if available
								if (item.profileQuality) {
									const quality = [];
									if (!item.profileQuality.hasProfilePic)
										quality.push('No pic');
									if (!item.profileQuality.hasBio) quality.push('No bio');
									if (!item.profileQuality.hasPosts) quality.push('No posts');

									if (quality.length > 0) {
										output += `  Profile: ${quality.join(', ')}\n`;
									}
								}

								for (const reason of item.reasons) {
									output += `  • ${reason}\n`;
								}

								output += '\n';
							}

							output += `\n💡 Tip: Use 'followers export -o results.json' to save full results`;
						} else {
							output += `✅ Great! All your follows look legitimate.`;
						}

						setResult(output);

						break;
					}

					case 'export': {
						if (!options.output) {
							setError(
								'Please specify an output file with --output or -o flag',
							);
							return;
						}

						setResult('📦 Exporting analysis...');

						let analysisResult = await client.analyzeFollowing({
							inactiveDays: options.inactiveDays,
							checkActivity: !options.noActivity,
							maxUsers: options.maxUsers,
						});

						// Filter to inactive only if requested
						if (options.inactiveOnly) {
							analysisResult = analysisResult.filter(
								a => a.activity.isInactive,
							);
						}

						// Sort results based on user preference
						if (options.sortBy === 'inactive') {
							analysisResult.sort(
								(a, b) =>
									(b.activity.daysSinceLastPost ?? 0) -
									(a.activity.daysSinceLastPost ?? 0),
							);
						} else if (options.sortBy === 'posts') {
							analysisResult.sort(
								(a, b) => a.user.mediaCount - b.user.mediaCount,
							);
						} else {
							// Default: sort by suspicion score
							analysisResult.sort(
								(a, b) => b.suspicionScore - a.suspicionScore,
							);
						}

						const fs = await import('node:fs/promises');
						const exportData = {
							exportDate: new Date().toISOString(),
							totalAnalyzed: analysisResult.length,
							suspiciousCount: analysisResult.filter(a => a.suspicionScore > 0)
								.length,
							inactiveCount: analysisResult.filter(a => a.activity.isInactive)
								.length,
							inactiveDaysThreshold: options.inactiveDays,
							filterApplied: options.inactiveOnly
								? 'inactive-only'
								: 'all-users',
							sortedBy: options.sortBy,
							users: analysisResult.map(a => ({
								username: a.user.username,
								fullName: a.user.fullName,
								isVerified: a.user.isVerified,
								isPrivate: a.user.isPrivate,
								followerCount: a.user.followerCount,
								followingCount: a.user.followingCount,
								mediaCount: a.user.mediaCount,
								relationship: a.relationship,
								activity: {
									lastPostDate: a.activity.lastPostDate?.toISOString(),
									daysSinceLastPost: a.activity.daysSinceLastPost,
									isInactive: a.activity.isInactive,
								},
								profileQuality: a.profileQuality,
								suspicionScore: a.suspicionScore,
								reasons: a.reasons,
							})),
						};

						await fs.writeFile(
							options.output,
							JSON.stringify(exportData, null, 2),
						);

						const filterMsg = options.inactiveOnly
							? ` (${exportData.inactiveCount} inactive only)`
							: '';

						setResult(
							`✅ Export complete!\n\nSaved ${analysisResult.length} user analyses${filterMsg} to: ${options.output}`,
						);

						break;
					}
				}
			} catch (error_) {
				setError(
					`Command error: ${
						error_ instanceof Error ? error_.message : String(error_)
					}`,
				);
			}
		})();
	}, [client, isLoading, action, options]);

	if (clientError) {
		return <Alert variant="error">{clientError}</Alert>;
	}

	if (isLoading) {
		return (
			<Box flexDirection="column" padding={1}>
				<Spinner label="Connecting to Instagram..." />
			</Box>
		);
	}

	if (error) {
		return <Alert variant="error">{error}</Alert>;
	}

	// Show unfollow interactive UI
	if (showUnfollowUI && unfollowCandidates.length > 0) {
		return (
			<AltScreen>
				<UnfollowInteractive
					users={unfollowCandidates}
					title={`Select accounts to unfollow (${unfollowCandidates.length} non-mutual follows)`}
					onConfirm={async selectedUsers => {
						setShowUnfollowUI(false);
						setResult('⏳ Unfollowing selected accounts...');

						let successCount = 0;
						let errorCount = 0;

						// Sequential unfollowing with rate limiting

						for (const user of selectedUsers) {
							try {
								if (client) {
									// eslint-disable-next-line no-await-in-loop
									await client.unfollowUser(user.pk);
									successCount++;
								}
							} catch (error_) {
								errorCount++;
								console.error(`Failed to unfollow ${user.username}:`, error_);
							}
						}

						setResult(
							`✅ Unfollow complete!\n\n` +
								`Successfully unfollowed: ${successCount}\n` +
								`Failed: ${errorCount}`,
						);
					}}
				/>
			</AltScreen>
		);
	}

	// Show stats display
	if (action === 'stats' && statsData) {
		return (
			<AltScreen>
				<StatsDisplay
					followers={statsData.followers}
					following={statsData.following}
					mutualFollows={statsData.mutualFollows}
					notFollowingBack={statsData.notFollowingBack}
					notFollowedBack={statsData.notFollowedBack}
					username={statsData.currentUser?.username ?? 'you'}
					groupBy={options.groupBy}
				/>
			</AltScreen>
		);
	}

	if (!result) {
		return (
			<Box flexDirection="column" padding={1}>
				<Spinner label="Processing..." />
			</Box>
		);
	}

	// For actions that need full screen rendering (like analyze results)
	if (action === 'analyze' && analysis) {
		return (
			<AltScreen>
				<Box flexDirection="column" padding={1}>
					<Text>{result}</Text>
				</Box>
			</AltScreen>
		);
	}

	return (
		<Box flexDirection="column" padding={1}>
			<Text>{result}</Text>
		</Box>
	);
}
