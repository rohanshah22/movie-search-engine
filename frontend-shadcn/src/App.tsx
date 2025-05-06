import { useState } from "react";
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

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import './App.css';

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

  const handleSearch = async () => {
    console.log("Searching for:", query);
    try {
      const response = await fetch("http://localhost:8000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      console.log("Received data:", data);
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const openMovieCard = (movie: SearchResult) => {
    setSelectedMovie(movie);
  };

  const closeMovieCard = () => {
    setSelectedMovie(null);
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
      </div>
      <Table>
        <TableCaption>Movies</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Movie Name</TableHead>
            <TableHead className="text-center">Summary</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((movie) => (
            <TableRow key={movie.doc_id} onClick={() => openMovieCard(movie)}>
              <TableCell>{movie.title}</TableCell>
              <TableCell>{movie.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedMovie && (
        <Dialog open onOpenChange={closeMovieCard}>
          <DialogContent className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-3xl font-semibold mb-4">{selectedMovie.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
                <h3 className="font-semibold text-xl">Release Date</h3>
                <p>{selectedMovie.release_date}</p>
              </div>

              <div>
                <h3 className="font-semibold text-xl">Run Time</h3>
                <p>{selectedMovie.run_time}</p>
              </div>

              <div>
                <h3 className="font-semibold text-xl">Related Movies</h3>
                <ul>
                  {results
                    .filter((m) => m.doc_id !== selectedMovie.doc_id)
                    .slice(0, 5)
                    .map((m) => (
                      <li key={m.doc_id} className="text-blue-500 hover:underline cursor-pointer">{m.title}</li>
                    ))}
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default App;
