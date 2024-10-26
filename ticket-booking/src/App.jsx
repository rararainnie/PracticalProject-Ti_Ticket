import Home from "./pages/Home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MovieDetails from "./pages/movieDetails";
import MovieReservation from "./pages/movieReservation";
import ScrollToTop from "./components/scollToTop";
import BookingConfirmation from "./pages/BookingConfirmation";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movie-details/:movieName" element={<MovieDetails />} />
        <Route path="/movie-reservation/:movieName" element={<MovieReservation />} />
        <Route path="/booking-confirmation" element={<BookingConfirmation />} />
      </Routes>
    </Router>
  );
}

export default App;
