import React from 'react';
import {Text, Box} from 'ink';
import {Alert, Spinner} from '@inkjs/ui';
import zod from 'zod';
import {argument, option} from 'pastel';
import {useInstagramClient} from '../ui/hooks/use-instagram-client.js';
import type {FollowerAnalysis} from '../types/instagram.js';
import AltScreen from '../ui/components/full-screen.js';

export const args = zod.tuple([
	zod
		.enum(['stats', 'analyze', 'export'])
		.optional()
		.describe(
			argument({
				name: 'action',
				description:
					'Action to perform: stats (show counts), analyze (find fake friends), export (save to JSON)',
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

						const mutualCount = followers.filter(f =>
							followingPks.has(f.pk),
						).length;
						const notFollowingBack = following.filter(
							f => !followerPks.has(f.pk),
						).length;
						const notFollowedBack = followers.filter(
							f => !followingPks.has(f.pk),
						).length;

						setResult(
							`📊 Follower Statistics for @${currentUser?.username ?? 'you'}\n\n` +
								`👥 Followers: ${followers.length}\n` +
								`➡️  Following: ${following.length}\n` +
								`🤝 Mutual follows: ${mutualCount}\n` +
								`❌ You follow but they don't: ${notFollowingBack}\n` +
								`👻 They follow but you don't: ${notFollowedBack}\n` +
								`📈 Follower/Following ratio: ${(followers.length / Math.max(following.length, 1)).toFixed(2)}`,
						);

						break;
					}

					case 'analyze': {
						setResult(
							'🔍 Analyzing your following list...\nThis may take a while.',
						);

						const analysisResult = await client.analyzeFollowing({
							inactiveDays: options.inactiveDays,
							checkActivity: !options.noActivity,
							maxUsers: options.maxUsers,
						});

						setAnalysis(analysisResult);

						const suspiciousUsers = analysisResult.filter(
							a => a.suspicionScore > 0,
						);

						let output = `\n🕵️  Analysis Complete!\n\n`;
						output += `Analyzed ${analysisResult.length} users\n`;
						output += `Found ${suspiciousUsers.length} potentially fake friends\n\n`;

						if (suspiciousUsers.length > 0) {
							output += `🚩 Top suspicious accounts:\n\n`;

							for (const item of suspiciousUsers.slice(0, 20)) {
								output += `@${item.user.username} (Score: ${item.suspicionScore})\n`;
								output += `  Full name: ${item.user.fullName}\n`;
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

						const analysisResult = await client.analyzeFollowing({
							inactiveDays: options.inactiveDays,
							checkActivity: !options.noActivity,
							maxUsers: options.maxUsers,
						});

						const fs = await import('node:fs/promises');
						const exportData = {
							exportDate: new Date().toISOString(),
							totalAnalyzed: analysisResult.length,
							suspiciousCount: analysisResult.filter(a => a.suspicionScore > 0)
								.length,
							inactiveDaysThreshold: options.inactiveDays,
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
								suspicionScore: a.suspicionScore,
								reasons: a.reasons,
							})),
						};

						await fs.writeFile(
							options.output,
							JSON.stringify(exportData, null, 2),
						);

						setResult(
							`✅ Export complete!\n\nSaved ${analysisResult.length} user analyses to: ${options.output}`,
						);

						break;
					}
					// No default
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
