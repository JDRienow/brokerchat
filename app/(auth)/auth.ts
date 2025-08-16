import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getBrokerByEmail } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

export type UserType = 'broker';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      first_name?: string;
      last_name?: string;
      company_name?: string;
      subscription_tier?: string;
      subscription_status?: string;
      trial_ends_at?: string | null;
      logo_url?: string;
      team_id?: string | null;
      is_team_admin?: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    subscription_tier?: string;
    subscription_status?: string;
    trial_ends_at?: string | null;
    logo_url?: string;
    team_id?: string | null;
    is_team_admin?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    subscription_tier?: string;
    subscription_status?: string;
    trial_ends_at?: string | null;
    logo_url?: string;
    team_id?: string | null;
    is_team_admin?: boolean;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        try {
          const broker = await getBrokerByEmail(email);

          if (!broker) {
            await compare(password, DUMMY_PASSWORD);
            return null;
          }

          if (!broker.password_hash) {
            await compare(password, DUMMY_PASSWORD);
            return null;
          }

          // Allow users with pending subscriptions to sign in
          // They'll see a banner to complete payment
          if (broker.subscription_status === 'pending') {
            // Still allow login, but they'll see pending banner
          }

          const passwordsMatch = await compare(password, broker.password_hash);

          if (!passwordsMatch) return null;

          return {
            id: broker.id,
            email: broker.email,
            first_name: broker.first_name,
            last_name: broker.last_name,
            company_name: broker.company_name,
            subscription_tier: broker.subscription_tier,
            subscription_status: broker.subscription_status,
            trial_ends_at: broker.trial_ends_at,
            logo_url: broker.logo_url,
            type: 'broker',
            team_id: broker.team_id, // add team_id
            is_team_admin: broker.is_team_admin, // add is_team_admin
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
        token.first_name = user.first_name;
        token.last_name = user.last_name;
        token.company_name = user.company_name;
        token.subscription_tier = user.subscription_tier;
        token.subscription_status = user.subscription_status;
        token.trial_ends_at = user.trial_ends_at;
        token.logo_url = user.logo_url;
        token.team_id = user.team_id; // add team_id
        token.is_team_admin = user.is_team_admin; // add is_team_admin
      }

      // Refresh user data on token refresh
      if (trigger === 'update' && token.email) {
        try {
          const broker = await getBrokerByEmail(token.email as string);
          if (broker) {
            token.subscription_tier = broker.subscription_tier;
            token.subscription_status = broker.subscription_status;
            token.trial_ends_at = broker.trial_ends_at;
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
        session.user.first_name = token.first_name;
        session.user.last_name = token.last_name;
        session.user.company_name = token.company_name;
        session.user.subscription_tier = token.subscription_tier;
        session.user.subscription_status = token.subscription_status;
        session.user.trial_ends_at = token.trial_ends_at;
        session.user.logo_url = token.logo_url;
        session.user.team_id = token.team_id; // add team_id
        session.user.is_team_admin = token.is_team_admin; // add is_team_admin
      }

      return session;
    },
  },
});
