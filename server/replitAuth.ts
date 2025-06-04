import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Microsoft O365 authentication with Azure AD
  app.get("/api/login", (req, res) => {
    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_TENANT_ID) {
      return res.status(500).json({ error: "Microsoft Azure AD configuration missing" });
    }

    const baseUrl = process.env.NODE_ENV === 'development' 
      ? `http://localhost:5000` 
      : `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    
    const redirectUri = `${baseUrl}/api/callback`;
    const state = Math.random().toString(36).substring(7);
    
    // Store state in session for security
    (req.session as any).oauth_state = state;
    
    const microsoftLoginUrl = new URL('https://login.microsoftonline.com/' + process.env.MICROSOFT_TENANT_ID + '/oauth2/v2.0/authorize');
    microsoftLoginUrl.searchParams.set('client_id', process.env.MICROSOFT_CLIENT_ID);
    microsoftLoginUrl.searchParams.set('response_type', 'code');
    microsoftLoginUrl.searchParams.set('redirect_uri', redirectUri);
    microsoftLoginUrl.searchParams.set('scope', 'openid email profile');
    microsoftLoginUrl.searchParams.set('state', state);
    microsoftLoginUrl.searchParams.set('prompt', 'login');
    microsoftLoginUrl.searchParams.set('domain_hint', 'omneseducation.com');

    res.redirect(microsoftLoginUrl.toString());
  });

  // Microsoft O365 callback handler (demo mode)
  app.get("/api/callback", async (req, res) => {
    const { code, state, error } = req.query;
    
    if (error) {
      console.error("OAuth error:", error);
      return res.redirect("/api/login");
    }

    // Verify state for security
    if (state !== (req.session as any).oauth_state) {
      console.error("Invalid OAuth state");
      return res.redirect("/api/login");
    }

    // TODO: Uncomment when Azure AD app is properly configured
    /*
    if (!code || !process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
      return res.redirect("/api/login");
    }

    try {
      // Exchange code for token
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? `http://localhost:5000` 
        : `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      
      const tokenUrl = `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;
      const tokenParams = new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: `${baseUrl}/api/callback`,
      });

      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString(),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }

      const tokens = await tokenResponse.json();
      
      // Get user info from Microsoft Graph
      const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
      });

      if (!userResponse.ok) {
        throw new Error(`User info fetch failed: ${userResponse.status}`);
      }

      const userInfo = await userResponse.json();

      // Verify domain restriction
      if (!userInfo.mail || !userInfo.mail.endsWith('@omneseducation.com')) {
        return res.status(403).send('Access restricted to omneseducation.com domain');
      }

      // Create/update user in database
      await storage.upsertUser({
        id: userInfo.id,
        email: userInfo.mail,
        firstName: userInfo.givenName || 'User',
        lastName: userInfo.surname || 'O365',
        profileImageUrl: null,
      });

      // Store user session
      (req.session as any).user = {
        id: userInfo.id,
        email: userInfo.mail,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      };

      res.redirect("/");
    } catch (error) {
      console.error("Error during OAuth callback:", error);
      res.redirect("/api/login");
    }
    */

    // DEMO MODE: Simulate successful authentication until Azure AD is configured
    try {
      const demoEmail = "demo.user@omneseducation.com";
      const demoId = "demo-user-id";

      // Create/update demo user in database
      await storage.upsertUser({
        id: demoId,
        email: demoEmail,
        firstName: "Demo",
        lastName: "User",
        profileImageUrl: null,
      });

      // Store user session
      (req.session as any).user = {
        id: demoId,
        email: demoEmail,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      };

      res.redirect("/");
    } catch (error) {
      console.error("Error during demo callback:", error);
      res.redirect("/api/login");
    }
  });

  app.get("/api/logout", (req, res) => {
    (req.session as any).user = null;
    res.redirect("https://login.microsoftonline.com/common/oauth2/v2.0/logout");
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const session = req.session as any;
  const user = session?.user;

  if (!user || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now > user.expires_at) {
    session.user = null;
    return res.status(401).json({ message: "Unauthorized" });
  }

  return next();
};
