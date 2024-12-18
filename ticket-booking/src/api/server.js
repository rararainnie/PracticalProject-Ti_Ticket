import express from "express";
// import { createConnection } from "mysql2";
import mysql from 'mysql2';
import cors from "cors";

const app = express();
const port = 3001;

// เปิดใช้งาน CORS เพื่ออนุญาตการเชื่อมต่อจาก frontend (Vite)
app.use(cors());

// สร้างการเชื่อมต่อกับฐานข้อมูล MySQL
const db = mysql.createConnection({
  host: "localhost", // หรือ IP ของฐานข้อมูล MySQL
  user: "root", // ชื่อผู้ใช้งาน MySQL
  password: "pun1234", // รหัสผ่าน MySQL
  database: "movies_ticket_schema", // ชื่อฐานข้อมูล
});

// สร้างการเชื่อมต่อกับ TiDB Cloud
// const db = mysql.createConnection({
//   host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
//   port: 4000,
//   user: '4Ld6i7SH1CaZNag.root',
//   password: '7Q6tc9dHw8wgiu2t',
//   database: 'test',
//   ssl: {
//     minVersion: 'TLSv1.2',
//     rejectUnauthorized: true
//   }
// });

// ตรวจสอบการเชื่อมต่อ
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL Cloud successfully');
});

// จัดการ error ที่อาจเกิดขึ้น
db.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Reconnecting to database...');
    // พยายามเชื่อมต่อใหม่
    setTimeout(() => {
      db.connect();
    }, 2000);
  } else {
    throw err;
  }
});

// สร้าง API เพื่อดึงข้อมูลหนังทั้งหมดจากตาราง Movies
app.get("/movies", (req, res) => {
  const query = "SELECT * FROM Movies";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      res.status(500).send("Error fetching data");
      return;
    }
    res.json(results);
  });
});

// API เพื่อดึงข้อมูล CinemaLocation
app.get("/cinemalocation", (req, res) => {
  const query = "SELECT * FROM CinemaLocation";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      res.status(500).send("Error fetching data");
      return;
    }
    res.json(results);
  });
});

// API เพื่อดึงข้อมูล Zone
app.get("/zone", (req, res) => {
  const query = "SELECT * FROM Zone";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      res.status(500).send("Error fetching data");
      return;
    }
    res.json(results);
  });
});

// API เพื่อดึงหนังทุกเรื่องตาม CinemaLocation
app.get("/cinema/:CinemaLocationCode/movies", (req, res) => {
  const locationId = req.params.CinemaLocationCode;

  const query = `
    SELECT m.* 
    FROM CinemaLocation_has_Movies clm
    JOIN Movies m ON clm.Movies_MovieID = m.MovieID
    WHERE clm.CinemaLocation_CinemaLocationCode = ?
  `;

  db.query(query, [locationId], (err, results) => {
    if (err) {
      console.error("Error fetching movies:", err);
      res.status(500).send("Error fetching movies");
    } else {
      res.json(results);
    }
  });
});

// API เพื่อดึงข้อมูลโรงภาพยนตร์จาก MovieID
app.get("/movie/:MovieID/cinemas", (req, res) => {
  const movieId = req.params.MovieID; // แก้ไขจาก movieID เป็น MovieID

  const query = `
    SELECT cl.*
    FROM CinemaLocation_has_Movies clm
    JOIN CinemaLocation cl ON clm.CinemaLocation_CinemaLocationCode = cl.CinemaLocationCode
    WHERE clm.Movies_MovieID = ?
  `;

  db.query(query, [movieId], (err, results) => {
    if (err) {
      console.error("Error fetching cinemas:", err);
      res.status(500).send("Error fetching cinemas");
    } else {
      res.json(results);
    }
  });
});

// API เพื่อดึงข้อมูล CinemaNo และ ShowTime โดยใช้ MovieID และ CinemaLocationCode
app.get("/movie/:MovieID/cinema/:CinemaLocationCode", (req, res) => {
  const movieId = req.params.MovieID;
  const cinemaLocationCode = req.params.CinemaLocationCode;

  const query = `
    SELECT 
        st.TimeCode,
        st.ShowDateTime,
        st.CinemaNo_CinemaNoCode AS CinemaNo,
        cn.Name AS CinemaNoName,
        cl.Name AS CinemaLocationName,
        cl.CinemaLocationCode AS CinemaLocationId
    FROM 
        ShowTime st
    JOIN 
        CinemaNo cn ON st.CinemaNo_CinemaNoCode = cn.CinemaNoCode
    JOIN 
        CinemaLocation cl ON cn.CinemaLocation_CinemaLocationCode = cl.CinemaLocationCode
    WHERE 
        st.Movies_MovieID = ? 
        AND cl.CinemaLocationCode = ?
    ORDER BY 
        cl.Name
  `;

  db.query(query, [movieId, cinemaLocationCode], (err, results) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลโรงภาพยนตร์และรอบฉาย:", err);
      res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูลโรงภาพยนตร์และรอบฉาย");
    } else {
      res.json(results);
    }
  });
});

// API เพื่อดึงข้อมูล Seat ที่เกี่ยวข้องกับ TimeCode
app.get("/showtime/:TimeCode/seats", (req, res) => {
  const timeCode = req.params.TimeCode;

  const query = `
    SELECT 
        s.*
    FROM 
        Seats s
    JOIN 
        ShowTime st ON s.ShowTime_TimeCode = st.TimeCode
    WHERE 
        s.ShowTime_TimeCode = ?
    ORDER BY 
        s.SeatName
  `;

  db.query(query, [timeCode], (err, results) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลที่นั่ง:", err);
      res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูลที่นั่ง");
    } else {
      res.json(results);
    }
  });
});

// เพิ่ม middleware เพื่อ parse JSON body
app.use(express.json());

// API เพื่ออัปเดต Status ของที่นั่ง
app.put("/seat/:SeatCode/status", (req, res) => {
  const seatCode = req.params.SeatCode;
  const { Status, UserID } = req.body;

  if (!Status || !UserID) {
    return res.status(400).send("Status and UserID are required");
  }

  const query = `
    UPDATE Seats
    SET Status = ?, User_UserID = ?
    WHERE SeatCode = ?
  `;

  db.query(query, [Status, UserID, seatCode], (err, result) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการอัปเดตสถานะที่นั่ง:", err);
      res.status(500).send("เกิดข้อผิดพลาดในการอัปเดตสถานะที่นั่ง");
    } else {
      if (result.affectedRows === 0) {
        res.status(404).send("ไม่พบที่นั่งที่ระบุ");
      } else {
        res.status(200).send("อัปเดตสถานะที่นั่งและ UserID เรียบร้อยแล้ว");
      }
    }
  });
});

// เพิ่ม API สำหรับการเข้าสู่ระบบ
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const query = `
    SELECT UserID, FName, LName, Status
    FROM User
    WHERE Email = ? AND Password = ?
  `;

  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ:", err);
      res.status(500).send("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } else {
      if (results.length > 0) {
        res.json(results[0]);
      } else {
        res.status(401).send("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
    }
  });
});

// API เพื่อดึงข้อมูลการจองของผู้ใช้
app.get("/user/:UserID/bookings", (req, res) => {
  const userId = req.params.UserID;

  const query = `
    SELECT 
      m.Title AS MovieTitle,
      m.Image AS MovieImage,
      st.ShowDateTime,
      st.TimeCode AS ShowTimeCode,
      cl.Name AS CinemaLocationName,
      cn.Name AS CinemaNoName,
      GROUP_CONCAT(s.SeatName ORDER BY s.SeatName ASC SEPARATOR ', ') AS SeatNames,
      SUM(s.Price) AS TotalPrice
    FROM 
      Seats s
      JOIN ShowTime st ON s.ShowTime_TimeCode = st.TimeCode
      JOIN Movies m ON st.Movies_MovieID = m.MovieID
      JOIN CinemaNo cn ON st.CinemaNo_CinemaNoCode = cn.CinemaNoCode
      JOIN CinemaLocation cl ON cn.CinemaLocation_CinemaLocationCode = cl.CinemaLocationCode
    WHERE 
      s.User_UserId = ?
    GROUP BY 
      st.TimeCode
    ORDER BY 
      st.ShowDateTime DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลการจอง:", err);
      res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูลการจอง");
    } else {
      res.json(results);
    }
  });
});

// API สำหรับการลงทะเบียนผู้ใช้ใหม่
app.post("/register", (req, res) => {
  const { Email, Password, FName, LName } = req.body;

  // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
  if (!Email || !Password || !FName || !LName) {
    return res.status(400).send("กรุณากรอกข้อมูลให้ครบถ้วน");
  }

  // ตรวจส���บว่าอีเมลซ้ำหรือไม่
  const checkEmailQuery = "SELECT * FROM User WHERE Email = ?";
  db.query(checkEmailQuery, [Email], (err, results) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการตรวจสอบอีเมล:", err);
      return res.status(500).send("เกิดข้อผิดพลาดในการลงทะเบียน");
    }

    if (results.length > 0) {
      return res.status(409).send("อีเมลนี้ถูกใช้งานแล้ว");
    }

    // เพิ่มผู้ใช้ใหม่ลงในฐานข้อมูล
    const insertQuery =
      'INSERT INTO User (Email, Password, FName, LName, Status) VALUES (?, ?, ?, ?, "User")';
    db.query(insertQuery, [Email, Password, FName, LName], (err, result) => {
      if (err) {
        console.error("เกิดข้อผิดพลาดในการลงทะเบียน:", err);
        return res.status(500).send("เกิดข้อผิดพลาดในการลงทะเบียน");
      }

      res
        .status(201)
        .json({ message: "ลงทะเบียนสำเร็จ", userId: result.insertId });
    });
  });
});

// API สำหรับการรีเซ็ตรหัสผ่าน
app.put("/reset-password", (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).send("กรุณากรอกอีเมลและรหัสผ่านใหม่");
  }

  const query = `
    UPDATE User
    SET Password = ?
    WHERE Email = ?
  `;

  db.query(query, [newPassword, email], (err, result) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน:", err);
      return res.status(500).send("เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send("ไม่พบอีเมลในระบบ");
    }

    res.status(200).json({ message: "รีเซ็ตรหัสผ่านสำเร็จ" });
  });
});

// Admin API Endpoints
// ดึงข้อมูลทั้งหมดสำหรับ admin
app.get("/admin/:type", (req, res) => {
  const type = req.params.type;
  let query = "";

  switch (type) {
    case "movies":
      query = "SELECT * FROM Movies";
      break;
    case "cinemas":
      query = `
        SELECT cl.*, z.Name as ZoneName 
        FROM CinemaLocation cl 
        JOIN Zone z ON cl.Zone_ZoneID = z.ZoneID
      `;
      break;
    case "cinemaNo":
      query = `
        SELECT cn.*, cl.Name as CinemaLocationName
        FROM CinemaNo cn
        JOIN CinemaLocation cl ON cn.CinemaLocation_CinemaLocationCode = cl.CinemaLocationCode
      `;
      break;
    case "showtimes":
      query = `
        SELECT st.*, m.Title as MovieTitle, cn.Name as CinemaName, cl.Name as CinemaLocationName
        FROM ShowTime st
        JOIN Movies m ON st.Movies_MovieID = m.MovieID
        JOIN CinemaNo cn ON st.CinemaNo_CinemaNoCode = cn.CinemaNoCode
        JOIN CinemaLocation cl ON st.CinemaLocation_CinemaLocationCode = cl.CinemaLocationCode
      `;
      break;
    case "users":
      query = "SELECT UserID, Email, FName, LName, Status FROM User";
      break;
    default:
      return res.status(400).send("Invalid type");
  }

  db.query(query, (err, results) => {
    if (err) {
      console.error(`Error fetching ${type}:`, err);
      res.status(500).send(`Error fetching ${type}`);
    } else {
      res.json(results);
    }
  });
});

// เพิ่มข้อมูลใหม่
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

app.post("/admin/:type", upload.single("Image"), async (req, res) => {
  const { type } = req.params; // Get the type from the request parameters
  const imageBuffer = req.file?.buffer;

  let query;
  let values;

  switch (type) {
    case "movies": {
      const {
        MovieID,
        Title,
        Description,
        Genre,
        Rating,
        Duration,
        ReleaseDate,
      } = req.body;

      query = `INSERT INTO Movies (MovieID, Title, Description, Image, Genre, Rating, Duration, ReleaseDate) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      values = [
        MovieID,
        Title,
        Description,
        imageBuffer,
        Genre,
        Rating,
        Duration,
        ReleaseDate,
      ];
      break;
    }
    case "cinemas": {
      const { CinemaLocationCode, Name, ZoneID, NumberOfCinemas } = req.body;

      try {
        // ใช้ Promise เพื่อจัดการกับ callback
        const query = (sql, values) => {
          return new Promise((resolve, reject) => {
            db.query(sql, values, (error, results) => {
              if (error) reject(error);
              resolve(results);
            });
          });
        };

        // 1. เพิ่มข้อมูล CinemaLocation
        await query(
          `INSERT IGNORE INTO CinemaLocation (CinemaLocationCode, Name, Zone_ZoneID) 
           VALUES (?, ?, ?)`,
          [CinemaLocationCode, Name, ZoneID]
        );

        // หา CinemaNo ล่าสุดของโรงภาพยนตร์นี้
        const lastCinemaResult = await query(
          `SELECT MAX(CinemaNoCode) as lastNumber
           FROM CinemaNo`,
        );
        
        const startNumber = (lastCinemaResult[0].lastNumber || 0) + 1;
        
        // เพิ่ม CinemaNo ใหม่ต่อจากหมายเลขล่าสุด
        for (let i = startNumber; i < startNumber + parseInt(NumberOfCinemas); i++) {
          await query(
            `INSERT INTO CinemaNo (CinemaNoCode, Name, CinemaLocation_CinemaLocationCode)
             VALUES (?, ?, ?)`,
            [i, `Cinema ${i - startNumber + 1}`, CinemaLocationCode]
          );
        }

        return res.json({ 
          success: true, 
          message: "เพิ่มโรงภาพยนตร์และโรงฉายสำเร็จ"
        });

      } catch (error) {
        console.error("Error adding cinema:", error);
        return res.status(500).json({ 
          success: false, 
          message: "เกิดข้อผิดพลาดในการเพิ่มโรงภาพยนตร์",
          error: error.message 
        });
      }
    }
    case "showtimes": {
      const {
        TimeCode,
        ShowDateTime,
        MovieID,
        CinemaNoCode,
        CinemaLocationCode,
        ZoneID,
      } = req.body;

      try {
        // ใช้ Promise เพื่อจัดการกับ callback
        const query = (sql, values) => {
          return new Promise((resolve, reject) => {
            db.query(sql, values, (error, results) => {
              if (error) reject(error);
              resolve(results);
            });
          });
        };

        // 1. เพิ่มข้อมูลใน CinemaLocation_has_Movies
        await query(
          `INSERT INTO CinemaLocation_has_Movies 
           (CinemaLocation_CinemaLocationCode, Zone_ZoneID, Movies_MovieID)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
           CinemaLocation_CinemaLocationCode = VALUES(CinemaLocation_CinemaLocationCode)`,
          [CinemaLocationCode, ZoneID, MovieID]
        );

        // 2. เพิ่มข้อมูลใน Movies_has_CinemaNo
        await query(
          `INSERT INTO Movies_has_CinemaNo 
           (Movies_MovieID, CinemaNo_CinemaNoCode, CinemaLocation_CinemaLocationCode, Zone_ZoneID)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           Movies_MovieID = VALUES(Movies_MovieID)`,
          [MovieID, CinemaNoCode, CinemaLocationCode, ZoneID]
        );

        // 3. เพิ่มข้อมูลใน ShowTime
        await query(
          `INSERT INTO ShowTime 
           (TimeCode, ShowDateTime, Movies_MovieID, CinemaNo_CinemaNoCode, CinemaLocation_CinemaLocationCode, Zone_ZoneID)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [TimeCode, ShowDateTime, MovieID, CinemaNoCode, CinemaLocationCode, ZoneID]
        );

        // 4. ลบที่นั่งเก่าก่อนเพิ่มที่นั่งใหม่ (ถ้ามี)
        await query(
          `DELETE FROM Seats WHERE ShowTime_TimeCode = ?`,
          [TimeCode]
        );

        // หา SeatCode ล่าสุด
        const [lastSeat] = await query(
          `SELECT MAX(SeatCode) as maxCode FROM Seats`
        );

        let nextSeatCode = (lastSeat.maxCode || 0) + 1;

        // 5. สร้างที่นั่งใหม่แบบต่อเนื่อง
          const insertSeats = async (rowLabels, seatCount, price) => {
            for (const row of rowLabels) {
              for (let seatNum = 1; seatNum <= seatCount; seatNum++) {
                await query(
                  `INSERT INTO Seats 
                  (SeatCode, SeatName, Status, Price, ShowTime_TimeCode, ShowTime_Movies_MovieID, 
                   ShowTime_CinemaNo_CinemaNoCode, ShowTime_CinemaLocation_CinemaLocationCode, 
                   ShowTime_Zone_ZoneID)
                  VALUES (?, ?, 'available', ?, ?, ?, ?, ?, ?)`,
                  [
                    nextSeatCode,
                    `${row}${seatNum}`,
                    price,
                    TimeCode,
                    MovieID,
                    CinemaNoCode,
                    CinemaLocationCode,
                    ZoneID
                  ]
                );
                nextSeatCode++;
              }
            }
          };

          // แถว A (4 ที่นั่ง)
          await insertSeats(['A'], 4, 600.00);
          
          // แถว B-D (14 ที่นั่ง/แถว)
          await insertSeats(['B', 'C', 'D'], 14, 240.00);
          
          // แถว E-H (18 ที่นั่ง/แถว)
          await insertSeats(['E', 'F', 'G', 'H'], 18, 200.00);

        console.log('Seats added successfully');

        return res.json({ 
          success: true, 
          message: "เพิ่มรอบฉายและที่นั่งสำเร็จ"
        });

      } catch (error) {
        console.error("Error adding showtime:", error);
        return res.status(500).json({ 
          success: false, 
          message: "เกิดข้อผิดพลาดในการเพิ่มรอบฉาย",
          error: error.message 
        });
      }
    }
    default:
      return res.status(400).send("Invalid type");
  }

  db.query(query, values, (err, result) => {
    if (err) {
      console.error(`Error adding ${type}:`, err);
      return res.status(500).send(`Error adding ${type}`);
    }
    res.status(201).json({ id: result.insertId });
  });
});

// อัพเดทข้อมูล
app.put("/admin/:type/:id", (req, res) => {
  const data = req.body;

  let query = "";
  let values = [];

  switch (data.type) {
    case "movieRating":
      query = "UPDATE Movies SET Rating = ? WHERE MovieID = ?";
      values = [data.Rating, data.MovieID];
      break;
    // เพิ่ม cases อื่นๆ ตามความต้องการ
  }

  db.query(query, values, (err, result) => {
    if (err) {
      console.error(`Error updating ${data.type}:`, err);
      res.status(500).send(`Error updating ${data.type}`);
    } else {
      res.json({ message: "Updated successfully" });
    }
  });
});

// ลบข้อมูล
app.delete("/admin/:type/:id", (req, res) => {
  const type = req.params.type;
  const id = req.params.id;

  switch (type) {
    case "movies":
      // ลบข้อมูลตามลำดับ foreign key
      db.query("DELETE FROM Seats WHERE ShowTime_Movies_MovieID = ?", [id], (err) => {
        if (err) {
          console.error("Error deleting seats:", err);
          return res.status(500).send("Error deleting seats");
        }
        
        db.query("DELETE FROM ShowTime WHERE Movies_MovieID = ?", [id], (err) => {
          if (err) {
            console.error("Error deleting showtimes:", err);
            return res.status(500).send("Error deleting showtimes");
          }

          db.query("DELETE FROM Movies_has_CinemaNo WHERE Movies_MovieID = ?", [id], (err) => {
            if (err) {
              console.error("Error deleting movies_has_cinemano:", err);
              return res.status(500).send("Error deleting movies_has_cinemano");
            }

            db.query("DELETE FROM CinemaLocation_has_Movies WHERE Movies_MovieID = ?", [id], (err) => {
              if (err) {
                console.error("Error deleting cinemalocation_has_movies:", err);
                return res.status(500).send("Error deleting cinemalocation_has_movies");
              }

              db.query("DELETE FROM Movies WHERE MovieID = ?", [id], (err) => {
                if (err) {
                  console.error("Error deleting movie:", err);
                  return res.status(500).send("Error deleting movie");
                }
                res.json({ message: "Deleted successfully" });
              });
            });
          });
        });
      });
      break;

    case "cinemas":
      // ลบข้อมูลตามลำดับ foreign key
      db.query("DELETE FROM Seats WHERE ShowTime_CinemaLocation_CinemaLocationCode = ?", [id], (err) => {
        if (err) {
          console.error("Error deleting seats:", err);
          return res.status(500).send("Error deleting seats");
        }

        db.query("DELETE FROM ShowTime WHERE CinemaLocation_CinemaLocationCode = ?", [id], (err) => {
          if (err) {
            console.error("Error deleting showtimes:", err);
            return res.status(500).send("Error deleting showtimes");
          }

          // ลบข้อมูลจาก Movies_has_CinemaNo โดยใช้ subquery
          db.query(`
            DELETE FROM Movies_has_CinemaNo 
            WHERE CinemaNo_CinemaNoCode IN (
              SELECT CinemaNoCode 
              FROM CinemaNo 
              WHERE CinemaLocation_CinemaLocationCode = ?
            )`, [id], (err) => {
            if (err) {
              console.error("Error deleting movies_has_cinemano:", err);
              return res.status(500).send("Error deleting movies_has_cinemano");
            }

            db.query("DELETE FROM CinemaLocation_has_Movies WHERE CinemaLocation_CinemaLocationCode = ?", [id], (err) => {
              if (err) {
                console.error("Error deleting cinemalocation_has_movies:", err);
                return res.status(500).send("Error deleting cinemalocation_has_movies");
              }

              db.query("DELETE FROM CinemaNo WHERE CinemaLocation_CinemaLocationCode = ?", [id], (err) => {
                if (err) {
                  console.error("Error deleting cinema numbers:", err);
                  return res.status(500).send("Error deleting cinema numbers");
                }

                db.query("DELETE FROM CinemaLocation WHERE CinemaLocationCode = ?", [id], (err) => {
                  if (err) {
                    console.error("Error deleting cinema location:", err);
                    return res.status(500).send("Error deleting cinema location");
                  }
                  res.json({ message: "Deleted successfully" });
                });
              });
            });
          });
        });
      });
      break;

    case "showtimes":
      db.query("DELETE FROM Seats WHERE ShowTime_TimeCode = ?", [id], (err) => {
        if (err) {
          console.error("Error deleting seats:", err);
          return res.status(500).send("Error deleting seats");
        }
        
        db.query("DELETE FROM ShowTime WHERE TimeCode = ?", [id], (err) => {
          if (err) {
            console.error("Error deleting showtime:", err);
            return res.status(500).send("Error deleting showtime");
          }
          res.json({ message: "Deleted successfully" });
        });
      });
      break;

    case "users":
      db.query("DELETE FROM User WHERE UserID = ?", [id], (err) => {
        if (err) {
          console.error("Error deleting user:", err);
          return res.status(500).send("Error deleting user");
        }
        res.json({ message: "Deleted successfully" });
      });
      break;

    default:
      res.status(400).send("Invalid type");
  }
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
