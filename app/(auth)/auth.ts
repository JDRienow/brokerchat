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
        const broker = await getBrokerByEmail(email);

        if (!broker) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        if (!broker.password_hash) {
          await compare(password, DUMMY_PASSWORD);
          return null;
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
          type: 'broker',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
        token.first_name = user.first_name;
        token.last_name = user.last_name;
        token.company_name = user.company_name;
        token.subscription_tier = user.subscription_tier;
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
      }

      return session;
    },
  },
});
