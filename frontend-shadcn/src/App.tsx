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

import './App.css';

function App() {
  return (
    <div>
      <div className="flex flex-row">
        <Input placeholder="Type your movie description here" />
        <Button>shadcn button</Button>
      </div>
      <Table>
        <TableCaption>Movies</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Movie Name</TableHead>
            <TableHead>Summary</TableHead>
            <TableHead>Director</TableHead>
            <TableHead>Cast</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Movie Name</TableCell>
            <TableCell>Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary, Plot Summary</TableCell>
            <TableCell>Director, Director</TableCell>
            <TableCell>Cast, Cast, Cast, Cast, Cast</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

export default App;
