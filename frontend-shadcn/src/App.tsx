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
            <TableHead className="text-center">Movie Name</TableHead>
            <TableHead className="text-center">Summary</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Movie Name</TableCell>
            <TableCell>Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

export default App;
