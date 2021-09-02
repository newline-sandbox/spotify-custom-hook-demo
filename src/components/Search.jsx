import { useRef, useState } from "react";
import { useSpotify } from "../hooks/useSpotify";

const Search = () => {
  const [results, setResults] = useState([]);

  const inputRef = useRef(null);

  const { fetchSearchResults } = useSpotify();

  const handleOnSubmit = async (evt) => {
    evt.preventDefault();

    try {
      const { tracks } = await fetchSearchResults({
        query: inputRef.current.value,
        type: "track",
      });

      setResults(tracks.items);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <form>
        <label>
          Find Tracks:
          <input type="text" ref={inputRef} />
        </label>
        <button type="submit" onClick={handleOnSubmit}>
          Search
        </button>
      </form>
      <div>
        <h3>Results</h3>
        {results.length > 0 ? (
          <ul>
            {results.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>Name:</strong>{" "}
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.name}
                  </a>
                </div>
                <div>
                  <strong>Artists:</strong>{" "}
                  {item.artists.map((artist, i) => (
                    <div key={artist.id}>
                      <a
                        href={artist.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {artist.name}
                      </a>
                      {i < item.artists.length - 1 ? (
                        <span> &middot; </span>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div>
                  <strong>Preview: </strong>{" "}
                  {item.preview_url ? (
                    <div>
                      <audio controls>
                        <source src={item.preview_url} type="audio/mpeg" />
                        <p>
                          Your browser doesn't support HTML5 audio. Here is a{" "}
                          <a
                            href={item.preview_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            link to the audio
                          </a>{" "}
                          instead.
                        </p>
                      </audio>
                    </div>
                  ) : (
                    <span>No Preview Available</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No Results Found</p>
        )}
      </div>
    </div>
  );
};

export default Search;
