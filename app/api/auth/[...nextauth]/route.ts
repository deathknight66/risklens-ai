import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "RiskLens Auth",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@risklens.local" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(credentials.email) as any;
        
        if (!user) {
          return null;
        }

        const isMatch = bcrypt.compareSync(credentials.password, user.password_hash);
        
        const memberships = db.prepare('SELECT * FROM memberships WHERE user_id = ?').all(user.id) as any[];
        const activeOrgId = memberships.length > 0 ? memberships[0].organization_id : 'org_default';
        const role = memberships.length > 0 ? memberships[0].role : 'Unknown';

        // Log the authentication attempt
        const ip = req?.headers?.['x-forwarded-for'] || 'unknown';
        const userAgent = req?.headers?.['user-agent'] || 'unknown';
        db.prepare('INSERT INTO auth_logs (id, organization_id, user_id, ip, user_agent, login_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          `log_${crypto.randomBytes(8).toString('hex')}`,
          activeOrgId,
          user.id,
          ip,
          userAgent,
          new Date().toISOString(),
          isMatch ? 'Success' : 'Failed'
        );

        if (isMatch) {
          return { 
            id: user.id, 
            email: user.email, 
            name: user.email, 
            role,
            activeOrganizationId: activeOrgId,
            memberships
          };
        }
        
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.activeOrganizationId = user.activeOrganizationId;
        token.memberships = user.memberships;
      }

      if (trigger === "update" && session?.activeOrganizationId) {
        const targetOrgId = session.activeOrganizationId;
        const membership = token.memberships?.find((m: any) => m.organization_id === targetOrgId);
        
        if (!membership) {
          throw new Error("Unauthorized workspace switch");
        }

        // Audit Log (Rule C)
        try {
          db.prepare('INSERT INTO auth_logs (id, organization_id, user_id, ip, user_agent, login_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
            `log_${crypto.randomBytes(8).toString('hex')}`,
            targetOrgId,
            token.id,
            'internal_switch',
            'internal_switch',
            new Date().toISOString(),
            `Switched from ${token.activeOrganizationId}`
          );
        } catch (e) {
          console.error("Failed to log tenant switch", e);
        }

        // Rotate context and role (Rule B)
        token.activeOrganizationId = targetOrgId;
        token.role = membership.role;
      }

      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.activeOrganizationId = token.activeOrganizationId;
        session.user.memberships = token.memberships;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || "risklens_secret_key_for_development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
