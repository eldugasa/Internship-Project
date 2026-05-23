import { env } from "../config/env.js";

const baseCookieOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: "lax",
  path: "/",
};

export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

export const accessTokenCookieOptions = {
  ...baseCookieOptions,
  maxAge: 15 * 60 * 1000,
};

export const refreshTokenCookieOptions = {
  ...baseCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, accessTokenCookieOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions);
};

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, accessTokenCookieOptions);
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenCookieOptions);
};
