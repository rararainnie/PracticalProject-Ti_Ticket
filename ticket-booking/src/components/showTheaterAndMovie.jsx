import { useState, useEffect, useRef } from "react";
import { Buffer } from 'buffer';

function ShowTheaterAndMovie() {
  const [moviesData, setMoviesData] = useState([]);
  const [cinemaLocations, setCinemaLocations] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState([]);
  const [selectedCinema, setSelectedCinema] = useState([]);
  const [showMovieModal, setShowMovieModal] = useState(false); // For controlling Movie Modal visibility
  const [showCinemaModal, setShowCinemaModal] = useState(false); // For controlling Cinema Modal visibility
  const popupRef = useRef(null);
  const cinemaButtonRef = useRef(null);
  const movieButtonRef = useRef(null);
  const [isHoveredMovieButton, setIsHoveredMovieButton] = useState(false);
  const [isHoveredCinemaButton, setIsHoveredCinemaButton] = useState(false);

  // Fetch Movies
  useEffect(() => {
    fetch('http://localhost:3001/movies')
      .then(response => response.json())
      .then(data => {
        const formattedMovies = data.map(movie => ({
          id: movie.MovieId,
          poster: `data:image/jpeg;base64,${Buffer.from(movie.Image).toString('base64')}`,
          title: movie.Title,
          genre: movie.Genre,
          rating: movie.Rating.toString(),
          duration: `${movie.Duration} นาที`,
          releaseDate: new Date(movie.ReleaseDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
          description: movie.Description,
        }));
        setMoviesData(formattedMovies);
      })
      .catch(error => {
        console.error('Error fetching movies:', error);
      });
  }, []);

  // Fetch Cinema Locations
  useEffect(() => {
    fetch('http://localhost:3001/cinemalocation')
      .then(response => response.json())
      .then(data => {
        const formattedCinemaLocations = data.map(location => ({
          id: location.CinemaLocationCode,
          name: location.Name,
          zone: location.Zone_ZoneID,
        }));
        setCinemaLocations(formattedCinemaLocations);
      })
      .catch(error => {
        console.error('Error fetching cinema locations:', error);
      });
  }, []);

  // Fetch Zones
  useEffect(() => {
    fetch('http://localhost:3001/zone')
      .then(response => response.json())
      .then(data => {
        const formattedZones = data.map(zone => ({
          id: zone.ZoneID,
          name: zone.Name,
        }));
        setZones(formattedZones);
      })
      .catch(error => {
        console.error('Error fetching zones:', error);
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        popupRef.current && 
        !popupRef.current.contains(event.target) &&
        !cinemaButtonRef.current.contains(event.target) &&
        !movieButtonRef.current.contains(event.target)
      ) {
        setShowMovieModal(false);
        setShowCinemaModal(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
    setShowMovieModal(false);
  };

  const handleSelectCinema = (cinema) => {
    setSelectedCinema(cinema);
    setShowCinemaModal(false);
  };

  const handleCinemaClick = () => {
    setShowCinemaModal(!showCinemaModal);
    setShowMovieModal(false);
  };

  const handleMovieClick = () => {
    setShowMovieModal(!showMovieModal);
    setShowCinemaModal(false);
  };

  const handleSubmit = () => {
    if (!selectedCinema?.name && !selectedMovie?.title) {
      alert('กรุณาเลือกโรงภาพยนตร์ หรือ ภาพยนตร์ หรือ ทั้งสองอย่าง');
    } else if (selectedMovie?.title && !selectedCinema?.name) {
      alert(`ภาพยนตร์ที่เลือก: ${selectedMovie.title}`);
    } else if (!selectedMovie?.title && selectedCinema?.name) {
      alert(`โรงภาพยนตร์ที่เลือก: ${selectedCinema.name}`);
    } else {
      alert(`ภาพยนตร์ที่เลือก: ${selectedMovie.title}\nโรงภาพยนตร์ที่เลือก: ${selectedCinema.name}`);
    }
  };

  return (
    <div className="flex justify-center mt-8 relative mb-5">
      <div className="w-[50%] bg-gray-500 bg-opacity-30 rounded-md p-5">
        <div className="flex space-x-4">
          {/* คอลัมน์: เลือกโรงภาพยนตร์ */}
          <div className="flex-1 relative">
            <button
              ref={cinemaButtonRef}
              onClick={handleCinemaClick}
              onMouseEnter={() => setIsHoveredCinemaButton(true)}
              onMouseLeave={() => setIsHoveredCinemaButton(false)}
              className="w-full p-2 text-left border-b border-white flex justify-between items-center"
              style={{
                color: showCinemaModal || isHoveredCinemaButton ? 'red' : 'white',
                transition: 'color 0.3s ease'
              }}
            >
              <span>{selectedCinema.name || 'โรงภาพยนตร์ทั้งหมด'}</span>
              <span>{showCinemaModal ? '△' : '▽'}</span>
            </button>
          </div>

          {/* คอลัมน์: เลือกภาพยนตร์ */}
          <div className="flex-1 relative">
            <button
              ref={movieButtonRef}
              onClick={handleMovieClick}
              onMouseEnter={() => setIsHoveredMovieButton(true)}
              onMouseLeave={() => setIsHoveredMovieButton(false)}
              className="w-full p-2 text-left border-b border-white flex justify-between items-center"
              style={{
                color: showMovieModal|| isHoveredMovieButton ? 'red' : 'white',
                transition: 'color 0.3s ease'
              }}
            >
              <span>{selectedMovie.title || 'ภาพยนตร์ทั้งหมด'}</span>
              <span>{showMovieModal ? '△' : '▽'}</span>
            </button>
          </div>

          {/* Column: Search Button */}
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={handleSubmit}
              className="w-full p-2 bg-red-500 text-white rounded-md hover:bg-red-700"
              disabled={!selectedMovie || !selectedCinema} // Disable if no movie or cinema is selected
            >
              รอบฉาย
            </button>
          </div>
        </div>
      </div>

      {/* Movie Selection Pop-Up */}
      {showMovieModal && (
        <div ref={popupRef} className="absolute z-10 bg-white rounded-md shadow-lg w-[50%] mt-20">
          <div className="flex flex-wrap justify-between max-h-80 overflow-y-auto">
            {moviesData.map((movie) => (
              <div
                key={movie.id}
                onClick={() => handleSelectMovie(movie)} // Select movie
                className="flex flex-col items-center text-center p-2 hover:bg-gray-200 cursor-pointer"
              >
                <img src={movie.poster} alt={movie.title} className="w-40" />
                <span>{movie.releaseDate}</span> 
                <span>{movie.title}</span> 
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cinema Selection Pop-Up */}
      {showCinemaModal && (
        <div ref={popupRef} className="absolute z-10 bg-white rounded-md shadow-lg w-[50%] mt-20">
          <div className="flex flex-wrap justify-between max-h-80 overflow-y-auto">
            {zones.map((zone) => (
              <div key={zone.id} className="w-[48%] p-2">
                <h3 className="font-semibold">{zone.name}</h3>
                {cinemaLocations.filter(cinema => cinema.zone === zone.id).map(cinema => (
                  <div
                    key={cinema.id}
                    onClick={() => handleSelectCinema(cinema)}
                    className="flex items-center p-2 hover:bg-gray-200 cursor-pointer"
                  >
                    <span>{cinema.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ShowTheaterAndMovie;
