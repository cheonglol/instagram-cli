import React, {useState} from 'react';
import {Box, Text} from 'ink';
import {MultiSelect, ConfirmInput} from '@inkjs/ui';
import type {FollowerUser} from '../../types/instagram.js';

type UnfollowInteractiveProps = {
	readonly users: FollowerUser[];
	readonly onConfirm: (selectedUsers: FollowerUser[]) => Promise<void>;
	readonly title: string;
};

export function UnfollowInteractive({
	users,
	onConfirm,
	title,
}: UnfollowInteractiveProps) {
	const [step, setStep] = useState<'select' | 'confirm' | 'unfollowing'>(
		'select',
	);
	const [selectedUsers, setSelectedUsers] = useState<FollowerUser[]>([]);

	if (step === 'select') {
		const options = users.map(user => ({
			label: `@${user.username} - ${user.fullName}${user.isVerified ? ' ✓' : ''}`,
			value: user.username,
		}));

		return (
			<Box flexDirection="column" padding={1}>
				<Text bold color="cyan">
					{title}
				</Text>
				<Text dimColor>
					Use ↑↓ to navigate, Space to select, Enter to continue, Esc to cancel
				</Text>
				<Box marginTop={1}>
					<MultiSelect
						options={options}
						onChange={(selected: string[]) => {
							const selectedUserObjs = users.filter(u =>
								selected.includes(u.username),
							);
							setSelectedUsers(selectedUserObjs);
						}}
						onSubmit={() => {
							if (selectedUsers.length > 0) {
								setStep('confirm');
							}
						}}
					/>
				</Box>
				<Box marginTop={1}>
					<Text dimColor>Selected: {selectedUsers.length} users</Text>
				</Box>
			</Box>
		);
	}

	if (step === 'confirm') {
		return (
			<Box flexDirection="column" padding={1}>
				<Text bold color="yellow">
					⚠️ Confirm Unfollow
				</Text>
				<Box marginTop={1} flexDirection="column">
					<Text>You are about to unfollow {selectedUsers.length} users:</Text>
					<Box marginTop={1} flexDirection="column">
						{selectedUsers.slice(0, 10).map(user => (
							<Text key={user.username}> • @{user.username}</Text>
						))}
						{selectedUsers.length > 10 && (
							<Text dimColor>... and {selectedUsers.length - 10} more</Text>
						)}
					</Box>
				</Box>
				<Box marginTop={1}>
					<Text>
						Press{' '}
						<Text bold color="green">
							Y
						</Text>{' '}
						to confirm,{' '}
						<Text bold color="red">
							N
						</Text>{' '}
						to cancel
					</Text>
				</Box>
				<Box marginTop={1}>
					<ConfirmInput
						defaultChoice="cancel"
						onConfirm={async () => {
							setStep('unfollowing');
							await onConfirm(selectedUsers);
						}}
						onCancel={() => {
							setStep('select');
						}}
					/>
				</Box>
			</Box>
		);
	}

	return (
		<Box padding={1}>
			<Text color="green">✓ Unfollowing in progress...</Text>
		</Box>
	);
}
