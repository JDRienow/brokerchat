import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For broker users with an account
   */
  broker: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ['chat-model', 'chat-model-reasoning'],
  },
};
