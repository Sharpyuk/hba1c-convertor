import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { query } from "../../../utils/db";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Attach the user ID to the token during sign-in
      if (user) {
        try {
          const dbUser = await query("SELECT id FROM user_settings WHERE user_id = $1", [user.email]);
          if (dbUser.rows.length > 0) {
            token.id = dbUser.rows[0].id;
          }
        } catch (error) {
          console.error("Error fetching user ID:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Attach the user ID from the token to the session object
      session.user.id = token.id || null;
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      try {
        // Check if the user exists in the database
        const existingUser = await query("SELECT * FROM user_settings WHERE user_id = $1", [user.email]);

        if (existingUser.rows.length === 0) {
          // If the user doesn't exist, create a new record
          await query("INSERT INTO user_settings (user_id, nightscout_address) VALUES ($1, $2)", [
            user.email,
            "", // Default Nightscout address (empty)
          ]);
        }
      } catch (error) {
        console.error("Error during sign-in:", error);
      }
    },
  },
});