import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import seatSingle from "../assets/pic/seatSingle.png";
import seatPair from "../assets/pic/seatPair.png";
import checkMark from "../assets/pic/checkmark.png";
import userIcon from "../assets/pic/iconUser.png";

function ShowSeats({ timeCode, showDateTime, movie, cinema }) {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSeats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:3001/showtime/${timeCode}/seats`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        setSeats(data);
      } catch (err) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลที่นั่ง:", err);
        setError("ไม่สามารถโหลดข้อมูลที่นั่งได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setLoading(false);
      }
    };

    if (timeCode) {
      fetchSeats();
    }
  }, [timeCode]);

  const handleSeatClick = (seat) => {
    setSelectedSeats((prevSelectedSeats) => {
      if (prevSelectedSeats.some((s) => s.SeatCode === seat.SeatCode)) {
        return prevSelectedSeats.filter((s) => s.SeatCode !== seat.SeatCode);
      } else {
        return [...prevSelectedSeats, seat];
      }
    });
  };

  const getSeatImage = (seat) => {
    if (seat.Status !== "available") {
      return userIcon;
    } else if (selectedSeats.some((s) => s.SeatCode === seat.SeatCode)) {
      return checkMark;
    } else {
      if (seat.SeatName.startsWith("A")) return seatPair;
      if (seat.SeatName.startsWith("B")) return seatSingle;
      if (seat.SeatName.startsWith("C")) return seatSingle;
    }
    return null;
  };

  const renderSeats = () => {
    const rows = [...new Set(seats.map((seat) => seat.SeatName[0]))].sort();
    return rows.map((row) => (
      <div key={row} className="flex my-5 text-white text-lg">
        <span className="mr-auto opacity-30">{row}</span>
        {seats
          .filter((seat) => seat.SeatName.startsWith(row))
          .sort(
            (a, b) =>
              parseInt(a.SeatName.slice(1)) - parseInt(b.SeatName.slice(1))
          )
          .map((seat) => (
            <button
              key={seat.SeatCode}
              onClick={() =>
                seat.Status === "available" && handleSeatClick(seat)
              }
              disabled={seat.Status !== "available"}
            >
              <img
                src={getSeatImage(seat)}
                alt={seat.SeatCode}
                className={`mx-1 object-contain ${
                  getSeatImage(seat) === userIcon ? "w-7" : "w-10"
                }`}
              />
            </button>
          ))}
        <span className="ml-auto opacity-30">{row}</span>
      </div>
    ));
  };

  const calculateTotalPrice = () => {
    return selectedSeats.reduce(
      (total, seat) => total + parseFloat(seat.Price),
      0
    );
  };

  const handleBooking = () => {
    if (selectedSeats.length === 0) {
      alert("กรุณาเลือกที่นั่งอย่างน้อย 1 ที่นั่ง");
      return;
    }

    const bookingData = {
      timeCode,
      showDateTime,
      selectedSeats,
      totalPrice: calculateTotalPrice(),
      movie,
      cinema,
    };

    navigate("/booking-confirmation", { state: bookingData });
  };

  if (loading)
    return <p className="text-white text-center">กำลังโหลดข้อมูลที่นั่ง...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;
  if (seats.length === 0)
    return <p className="text-white text-center">ไม่พบข้อมูลที่นั่ง</p>;

  return (
    <div className="mt-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
        <div className="bg-gray-800 p-4 rounded-lg w-[150%]">
          <div className="w-[30%] flex justify-between mx-auto mb-5 text-yellow-500 items-center">
            <div className="w-20 h-32 flex flex-col ">
              <img
                src={seatSingle}
                alt="Premium Seat"
                className="w-full h-auto"
              />
              <p className="text-center mt-2">Premium</p>
              <p className="text-center">200 บาท</p>
            </div>

            <div className="w-20 h-32 flex flex-col  ">
              <img
                src={seatPair}
                alt="Suite Pair Seat"
                className="w-full h-auto"
              />
              <p className="text-center mt-2">Suite (Pair)</p>
              <p className="text-center">240 บาท</p>
            </div>
          </div>

          <div className="w-full h-12 bg-gray-700 mb-8 flex items-center justify-center text-white">
            จอภาพ
          </div>
          {renderSeats()}
        </div>

        <div className="w-[40%] text-white flex flex-col ml-auto mr-10">
          <div className=" bg-slate-800 rounded-md">
            <img src={movie.poster} className="w-[90%] m-3" />
            <h1 className="text-2xl font-bold my-3 text-center">
              {movie.title}
            </h1>

            <div className="text-[14px] ml-5 space-y-1">
              <p>รอบฉาย: {new Date(showDateTime).toLocaleString()}</p>
              <p>
                ที่นั่งที่เลือก:{" "}
                {selectedSeats.map((seat) => seat.SeatName).join(", ")}
              </p>
              <p>ราคารวม: {calculateTotalPrice().toFixed(2)} บาท</p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleBooking}
                className="w-[60%] my-4 bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={selectedSeats.length === 0}
              >
                จองที่นั่ง
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ShowSeats.propTypes = {
  timeCode: PropTypes.number.isRequired,
  showDateTime: PropTypes.string.isRequired,
  movie: PropTypes.object.isRequired,
  cinema: PropTypes.object.isRequired,
};

export default ShowSeats;
