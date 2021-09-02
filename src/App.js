import { Switch, Route, Redirect, Link } from "react-router-dom";
import Search from "./components/Search";
import ScrollToTop from "./components/ScrollToTop";
import SpotifyRedirect from "./components/SpotifyRedirect";
import { useSpotify } from "./hooks/useSpotify";

export default function App() {
  const {
    hasLoggedIn,
    hasRedirectedFromValidPopup,
    isLoading,
    login,
    logout,
    user,
  } = useSpotify();

  return (
    <>
      <h1>Spotify App</h1>

      <ScrollToTop />
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <Route exact path="/">
            <div>
              {hasLoggedIn ? (
                <>
                  <h3>Welcome {user.display_name}</h3>
                  <button onClick={logout}>Logout</button>
                  <Link to="/search">Search</Link>
                </>
              ) : (
                <button onClick={login}>Login</button>
              )}
            </div>
          </Route>

          <Route path="/callback">
            {hasLoggedIn ? (
              <Redirect to="/dashboard" />
            ) : hasRedirectedFromValidPopup ? (
              <SpotifyRedirect />
            ) : (
              <Redirect to="/" />
            )}
          </Route>

          <Switch>
            <Route path="/dashboard">
              {hasLoggedIn ? (
                <div>Dashboard: {JSON.stringify(user)}</div>
              ) : (
                <Redirect to="/" />
              )}
            </Route>
            <Route path="/search">
              {hasLoggedIn ? <Search /> : <Redirect to="/" />}
            </Route>
          </Switch>
        </>
      )}
    </>
  );
}
