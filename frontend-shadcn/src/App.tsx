import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import './App.css';

function App() {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    console.log("Search query:", query);

    try {
      const response = await axios.post("http://localhost:8000/search", {
        query: query,
      });

      console.log("Backend response:", response.data);
      setResults(response.data); // Save results for table display
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };
  return (
    <div>
      <div className="flex flex-row">
        <Input 
          placeholder="Type your movie description here"
          value={query}
          onChange={(e) => setQuery(e.target.value)}/>
        <Button onClick={handleSearch}>search</Button>
      </div>
      <Table>
        <TableCaption>Movies</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Movie Name</TableHead>
            <TableHead>Summary</TableHead>
            <TableHead>Director</TableHead>
            <TableHead>Cast</TableHead>
            <TableHead>Related Movies</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Movie Name</TableCell>
            <TableCell>Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary</TableCell>
            <TableCell>Director, Director</TableCell>
            <TableCell>Cast, Cast, Cast, Cast, Cast</TableCell>
            <TableCell>Movie, Movie, Movie, Movie, Movie</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

export default App;
