import { createContext, useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { buildQueryString, generateState } from "../utils/spotify";

// Environment variables from `.env` file.
const {
  REACT_APP_SPOTIFY_CLIENT_ID,
  REACT_APP_SPOTIFY_REDIRECT_URI,
  REACT_APP_SPOTIFY_SCOPES,
} = process.env;

const BASE_API_URL = "https://api.spotify.com/v1";

const LS_KEYS = {
  ACCESS_TOKEN: "SPOTIFY_ACCESS_TOKEN",
  EXP_TIMESTAMP: "SPOTIFY_TOKEN_EXPIRE_TIMESTAMP",
  TOKEN_TYPE: "SPOTIFY_TOKEN_TYPE",
};

const spotifyContext = createContext();

export const SpotifyProvider = ({ children }) => {
  const spotify = useProvideSpotify();

  return (
    <spotifyContext.Provider value={spotify}>
      {children}
    </spotifyContext.Provider>
  );
};

export const useSpotify = () => {
  return useContext(spotifyContext);
};

const useProvideSpotify = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [tokenExp, setTokenExp] = useState(null);

  const history = useHistory();

  const callEndpoint = async ({ path, method = "GET" }) => {
    if (hasTokenExpired()) {
      invalidateToken();

      throw new Error("Token has expired.");
    }

    return await (
      await fetch(`${BASE_API_URL}${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method,
      })
    ).json();
  };

  const fetchCurrentUserInfo = async () => {
    return await callEndpoint({ path: "/me", token });
  };

  const fetchSearchResults = async ({
    query,
    type = "album,artist,playlist,track,show,episode",
    limit = 20,
  }) => {
    const qs = buildQueryString({
      q: query,
      type,
      limit,
    });

    return await callEndpoint({ path: `/search?${qs}`, token });
  };

  const login = () => {
    const popup = window.open(
      `https://accounts.spotify.com/authorize?client_id=${REACT_APP_SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REACT_APP_SPOTIFY_REDIRECT_URI
      )}&scope=${encodeURIComponent(
        REACT_APP_SPOTIFY_SCOPES
      )}&response_type=token&state=${generateState(16)}&show_dialog=true`,
      "Login with Spotify",
      "width=600,height=800"
    );

    window.spotifyAuthCallback = async (accessToken, expTimestamp) => {
      popup.close();

      setToken(accessToken);
      setTokenExp(expTimestamp);
    };
  };

  const storeTokenAtRedirect = () => {
    const searchParams = new URLSearchParams(window.location.hash.substring(1));

    try {
      const accessToken = searchParams.get("access_token");
      const expiresIn = parseInt(searchParams.get("expires_in"), 10);
      const tokenType = searchParams.get("token_type");

      const expTimestamp = Math.floor(Date.now() / 1000 + expiresIn); // In seconds.

      window.localStorage.setItem(LS_KEYS.ACCESS_TOKEN, accessToken);
      window.localStorage.setItem(LS_KEYS.EXP_TIMESTAMP, expTimestamp);
      window.localStorage.setItem(LS_KEYS.TOKEN_TYPE, tokenType);

      window.opener.spotifyAuthCallback(accessToken, expTimestamp);
    } catch (err) {
      console.error(err);

      throw new Error(`Could not store token information in local storage.`);
    }
  };

  const invalidateToken = () => {
    try {
      Object.values(LS_KEYS).forEach((key) => {
        window.localStorage.removeItem(key);
      });
    } catch (err) {
      console.error(err);
    }

    setUser(null);
    setToken(null);
    setTokenExp(null);
  };

  const logout = () => {
    invalidateToken();

    window.location.reload();
  };

  const hasTokenExpired = () => {
    try {
      const accessToken =
        token || window.localStorage.getItem(LS_KEYS.ACCESS_TOKEN);
      const expTimestamp =
        tokenExp ||
        parseInt(window.localStorage.getItem(LS_KEYS.EXP_TIMESTAMP), 10);

      if (!accessToken || !expTimestamp || isNaN(expTimestamp)) {
        return false;
      }

      return Date.now() / 1000 > expTimestamp;
    } catch (err) {
      console.error(err);

      return true;
    }
  };

  const hasLoggedIn = () => {
    return !!token && !!user && !hasTokenExpired();
  };

  const hasRedirectedFromValidPopup = () => {
    if (window.opener === null) {
      return false;
    }

    const { hostname: openerHostname } = new URL(window.opener.location.href);
    const { hostname } = new URL(window.location.href);

    return (
      window.opener &&
      window.opener !== window &&
      !!window.opener.spotifyAuthCallback &&
      openerHostname === hostname &&
      history.length >= 2
    );
  };

  const loadCurrentUser = async () => {
    try {
      const user = await fetchCurrentUserInfo();

      setUser(user);
    } catch (err) {
      console.error(err);

      history.push("/");
    }
  };

  useEffect(() => {
    try {
      const accessToken = window.localStorage.getItem(LS_KEYS.ACCESS_TOKEN);
      const expTimestamp = parseInt(
        window.localStorage.getItem(LS_KEYS.EXP_TIMESTAMP),
        10
      );

      if (accessToken && expTimestamp && Number.isInteger(expTimestamp)) {
        setToken(accessToken);
        setTokenExp(expTimestamp);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);

      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token && tokenExp) {
      if (!user) {
        loadCurrentUser();
      } else {
        setIsLoading(false);
      }
    }
  }, [token, tokenExp, user]);

  return {
    user,
    login,
    logout,
    isLoading,
    get hasLoggedIn() {
      return hasLoggedIn();
    },
    get hasRedirectedFromValidPopup() {
      return hasRedirectedFromValidPopup();
    },
    storeTokenAtRedirect,
    fetchCurrentUserInfo,
    fetchSearchResults,
  };
};
