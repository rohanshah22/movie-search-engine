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
        <Button>search</Button>
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
