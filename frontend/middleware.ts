import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const publicPaths = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/sso-callback(.*)']);

export default clerkMiddleware((auth, req) => {
  if (!publicPaths(req)) auth.protect();
});
  
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};