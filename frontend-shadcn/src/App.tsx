import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import "./App.css";

type SearchResult = {
  doc_id: number;
  title: string;
  score: number;
  description: string;
  release_date: string;
  run_time: number;
  cast: string[];
  director: string;
};

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<SearchResult | null>(null);
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [directorFilter, setDirectorFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [minRuntime, setMinRuntime] = useState<number | "">("");
  const [maxRuntime, setMaxRuntime] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("relevancy");
  // const moviePosterUrl =
  //   "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg";

  const [moviePosterUrl, setMoviePosterUrl] = useState<string | null>(null); // New state for the poster URL

  const topic_labels = {
    0: "Crime / Action",
    1: "Family / Drama",
    2: "Military / War",
    3: "Western / Outlaw",
    4: "School / Sports",
    5: "Domestic / Thriller",
    6: "Adventure / Survival",
    7: "Sci-Fi / Horror",
    8: "Meta / Art Film",
    9: "Chase / Comedy",
  };

  const [relatedData, setRelatedData] = useState<
    Record<string, { title: string; score: number; index: number }[]>
  >({});

  useEffect(() => {
    fetch("../middleware/related_movies.json")
      .then((res) => res.json())
      .then((data) => setRelatedData(data))
      .catch((err) => console.error("Failed to load related movies", err));
  }, []);

  const [dominantTopics, setDominantTopics] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    fetch("../middleware/lda_topic_scores.json")
      .then((res) => res.json())
      .then((data) => {
        const dominant: Record<string, string> = {};

        for (const movie of data) {
          const scores = movie.topic_scores;
          const maxTopic = Object.entries(scores).reduce(
            (max, [topic, score]) => {
              const numScore =
                typeof score === "number" ? score : parseFloat(score as string);
              return numScore > max.score
                ? { topic: parseInt(topic), score: numScore }
                : max;
            },
            { topic: -1, score: -Infinity }
          );
          dominant[movie.title] =
            topic_labels[maxTopic.topic as keyof typeof topic_labels];
        }

        setDominantTopics(dominant);
      })
      .catch((err) => console.error("Failed to load topic scores", err));
  }, []);

  const toggleFilters = () => {
    setFiltersCollapsed(!filtersCollapsed);
  };

  const filteredAndSortedResults = results
    .filter((movie) => {
      // Filter by director
      const directorCheck =
        directorFilter === "" ||
        movie.director.toLowerCase().includes(directorFilter.toLowerCase());

      // Existing runtime/date filters
      const runtimeCheck =
        (minRuntime === "" || movie.run_time >= minRuntime) &&
        (maxRuntime === "" || movie.run_time <= maxRuntime);
      const dateCheck =
        (startDate === "" || movie.release_date >= startDate) &&
        (endDate === "" || movie.release_date <= endDate);

      return directorCheck && runtimeCheck && dateCheck;
    })
    .sort((a, b) => {
      let valA, valB;
      if (sortBy === "runtime") {
        valA = a.run_time;
        valB = b.run_time;
      } else if (sortBy === "release_date") {
        valA = new Date(a.release_date).getTime();
        valB = new Date(b.release_date).getTime();
      } else {
        // "relevancy"
        valA = a.score;
        valB = b.score;
      }
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

  const handleSearch = async () => {
    try {
      const response = await fetch("http://localhost:8000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setResults(data);
      console.log("Line 150");
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const openMovieCard = (movie: SearchResult) => {
    setSelectedMovie(movie);
    searchMovieURL();
    console.log(moviePosterUrl);
    // setMoviePosterUrl(null); // Clear the previous poster when opening a new movie card
  };

  const closeMovieCard = () => {
    setSelectedMovie(null);
    // setMoviePosterUrl(null); // Clear the poster when closing the movie card
  };

  const searchMovieURL = async () => {
    const apiKey =
      "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxYzg3ZWRjZWIwZmJmZmJkM2NjYjA4YTViYmY5YWQwMyIsIm5iZiI6MS43NDYzOTIzNDE2MDMwMDAyZSs5LCJzdWIiOiI2ODE3ZDUxNTg2MGM1ZjQ5M2VkNGNiMjAiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.48sraTg94Sy81HnSdhrqRgtCvt1k6XMbmWIwoX11eGI"; // Fetch movie data for "The Dark Knight"

    try {
      const response = await fetch(
        "https://api.themoviedb.org/3/search/movie?include_adult=false&language=en-US&page=1&query=The+Dark+Knight",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            accept: "application/json",
          },
        }
      );
      const data = await response.json();
      console.log("GOT IT");

      const posterPath = data.results[0].poster_path;
      const mV = `https://image.tmdb.org/t/p/w500${posterPath}`;
      setMoviePosterUrl(mV);
    } catch (error) {
      console.error("Error fetching movie data:", error);
    }
  };

  return (
    <div>
      <h2 className="scroll-m-20 border-b pb-2 text-4xl font-semibold tracking-tight first:mt-0">
        Mov Map
      </h2>

      <div className="flex flex-row mb-4">
        <Input
          placeholder="Type your movie description here"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button onClick={handleSearch}>Search</Button>
        <Button onClick={toggleFilters}>Filters</Button>
      </div>

      {!filtersCollapsed && (
        <div className="flex flex-row space-x-2 mb-4">
          <Input
            placeholder="Min Runtime (in minutes)"
            value={minRuntime}
            onChange={(e) => setMinRuntime(Number(e.target.value) || "")}
          />
          <Input
            placeholder="Max Runtime (in minutes)"
            value={maxRuntime}
            onChange={(e) => setMaxRuntime(Number(e.target.value) || "")}
          />
          <Input
            type="date"
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            placeholder="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Input
            placeholder="Filter by Director"
            value={directorFilter}
            onChange={(e) => setDirectorFilter(e.target.value)}
          />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="relevancy">Relevancy</option>
            <option value="runtime">Runtime</option>
            <option value="release_date">Release Date</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      )}

      <Table>
        <TableCaption>Movies</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Movie Name</TableHead>
            <TableHead className="text-center">Summary</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedResults.map((movie) => (
            <TableRow key={movie.doc_id} onClick={() => openMovieCard(movie)}>
              <TableCell>{movie.title}</TableCell>
              <TableCell>{movie.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedMovie && (
        <Dialog open onOpenChange={closeMovieCard}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto mx-auto bg-white rounded-lg shadow-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-3xl font-semibold mb-6">
                {selectedMovie.title}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-row space-x-6">
              {moviePosterUrl && (
                <img
                  src={moviePosterUrl}
                  alt="Movie poster"
                  className="w-48 max-w-xs max-h-[400px] rounded-lg object-contain"
                />
              )}

              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="font-semibold text-xl">Description</h3>
                  <p>{selectedMovie.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-xl">Director</h3>
                  <p>{selectedMovie.director}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-xl">Cast</h3>
                  <p>{selectedMovie.cast}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-xl">Dominant Topic</h3>
                  <p>{dominantTopics[selectedMovie.title]}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-xl">Release Date</h3>
                  <p>{selectedMovie.release_date}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-xl">Runtime</h3>
                  <p>{selectedMovie.run_time} minutes</p>
                </div>

                <Button onClick={closeMovieCard}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default App;
