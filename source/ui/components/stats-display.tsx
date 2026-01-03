import React from 'react';
import {Box, Text} from 'ink';
import type {FollowerUser} from '../../types/instagram.js';

type StatsDisplayProps = {
	followers: FollowerUser[];
	following: FollowerUser[];
	mutualFollows: FollowerUser[];
	notFollowingBack: FollowerUser[];
	notFollowedBack: FollowerUser[];
	username: string;
	groupBy?: 'none' | 'verified' | 'follower-count' | 'mutual';
};

export function StatsDisplay({
	followers,
	following,
	mutualFollows,
	notFollowingBack,
	notFollowedBack,
	username,
	groupBy = 'none',
}: StatsDisplayProps) {
	const followerDifference = followers.length - following.length;
	const diffSign = followerDifference >= 0 ? '+' : '';

	const renderUserList = (users: FollowerUser[], limit = 20) => {
		if (users.length === 0) {
			return <Text dimColor> None</Text>;
		}

		const displayUsers = users.slice(0, limit);
		return (
			<Box flexDirection="column">
				{displayUsers.map(user => (
					<Text key={user.username}>
						• @{user.username}
						{user.isVerified && ' ✓'}
						{user.fullName && ` - ${user.fullName}`}
					</Text>
				))}
				{users.length > limit && (
					<Text dimColor> ... and {users.length - limit} more</Text>
				)}
			</Box>
		);
	};

	const groupUsers = (users: FollowerUser[]) => {
		if (groupBy === 'verified') {
			const verified = users.filter(u => u.isVerified);
			const unverified = users.filter(u => !u.isVerified);
			return {Verified: verified, Unverified: unverified};
		}

		if (groupBy === 'follower-count') {
			// We don't have follower counts in FollowerUser, so this is a placeholder
			return {'All Users': users};
		}

		return {'All Users': users};
	};

	return (
		<Box flexDirection="column" padding={1}>
			<Text bold color="cyan">
				📊 Follower Statistics for @{username}
			</Text>
			<Box marginTop={1} flexDirection="column">
				<Text>
					👥 <Text bold>Followers:</Text> {followers.length}
				</Text>
				<Text>
					➡️ <Text bold>Following:</Text> {following.length}
				</Text>
				<Text>
					📊 <Text bold>Difference:</Text> {diffSign}
					{followerDifference} (followers - following)
				</Text>
				<Text>
					🤝 <Text bold>Mutual follows:</Text> {mutualFollows.length}
				</Text>
				<Text>
					❌ <Text bold>You follow but they don't:</Text>{' '}
					{notFollowingBack.length}
				</Text>
				<Text>
					👻 <Text bold>They follow but you don't:</Text>{' '}
					{notFollowedBack.length}
				</Text>
				<Text>
					📈 <Text bold>Follower/Following ratio:</Text>{' '}
					{(followers.length / Math.max(following.length, 1)).toFixed(2)}
				</Text>
			</Box>

			{mutualFollows.length > 0 && (
				<Box marginTop={1} flexDirection="column">
					<Text bold color="green">
						🤝 Mutual Follows ({mutualFollows.length})
					</Text>
					{Object.entries(groupUsers(mutualFollows)).map(([group, users]) => (
						<Box key={group} flexDirection="column" marginTop={1}>
							{groupBy !== 'none' && (
								<Text bold color="blue">
									{group}:
								</Text>
							)}
							{renderUserList(users, 15)}
						</Box>
					))}
				</Box>
			)}

			{notFollowingBack.length > 0 && (
				<Box marginTop={1} flexDirection="column">
					<Text bold color="red">
						❌ Not Following Back ({notFollowingBack.length})
					</Text>
					{Object.entries(groupUsers(notFollowingBack)).map(
						([group, users]) => (
							<Box key={group} flexDirection="column" marginTop={1}>
								{groupBy !== 'none' && (
									<Text bold color="blue">
										{group}:
									</Text>
								)}
								{renderUserList(users, 15)}
							</Box>
						),
					)}
				</Box>
			)}

			{notFollowedBack.length > 0 && (
				<Box marginTop={1} flexDirection="column">
					<Text bold color="yellow">
						👻 You Don't Follow Back ({notFollowedBack.length})
					</Text>
					{Object.entries(groupUsers(notFollowedBack)).map(([group, users]) => (
						<Box key={group} flexDirection="column" marginTop={1}>
							{groupBy !== 'none' && (
								<Text bold color="blue">
									{group}:
								</Text>
							)}
							{renderUserList(users, 15)}
						</Box>
					))}
				</Box>
			)}

			<Box marginTop={1}>
				<Text dimColor>
					💡 Tip: Use 'instagram-cli followers unfollow' for interactive cleanup
				</Text>
			</Box>
		</Box>
	);
}
