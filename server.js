const express = require("express");
const app = express();
const fs = require("fs");
const PORT = 3000;

const data = fs.readFileSync("data.txt", "utf-8"); //{ users : [], movies : [] }
const datajson = JSON.parse(data); // obj

let userId = datajson.users.length;
app.post("/signup", (req, res) => {
  const { username, password, email } = req.body;

  datajson.users.push({
    id: userId,
    username,
    password,
    email,
    bookings: [],
  });

  fs.writeFileSync("data.txt", JSON.stringify(datajson));
  res.status(201).json({
    message: "User created successfully",
    userId: userId,
  });
});

app.get("/movies", (req, res) => {
  res.status(200).json({
    movies: datajson.movies,
  });
});

app.get("/movies/:movieId", (req, res) => {
  const movieId = req.params.movieId;

  for (let i = 0; i < datajson.movies.length; i++) {
    if (datajson.movies[i]["id"] == movieId) {
      return res.json({
        message: datajson.movies[i],
      });
    }
  }
  res.status(404).json({
    message: "Movie not found",
  });
});

app.get("movies/:movieId/shows", (req, res) => {
  const { movieId } = req.params;

  for (let i = 0; i < datajson.movies.length; i++) {
    if (datajson.movies[i]["id"] == movieId) {
      return res.status(200).json({
        message: datajson.movies[i].shows,
      });
    }
  }
  res.json({
    message: "something wrong",
  });
});

const bookingId = 1001;

app.post("/bookings/:userId", (req, res) => {
  const userId = req.params.userId;
  const { movieId, showId, seats } = req.body;

  const user = datajson.users.find((user) => user.id == userId);
  const movie = datajson.movies.find((movie) => movie.id == movieId);
  const show = movie.shows.find((show) => show.showId == showId);

  const now = new Date();

  if (show.availableSeats >= seats && user) {
    user.bookings.push({
      bookingId: bookingId,
      movieId: movieId,
      showId: showId,
      seats: seats,
      totalAmount: seats * show.pricePerSeat,
      status: "confirmed",
      bookingDate:
        now.getDate() +
        " " +
        (parseInt(now.getMonth()) + 1) +
        " " +
        now.getFullYear(),
    });
    show.availableSeats = show.availableSeats - seats;
    fs.writeFileSync("data.txt", JSON.stringify(datajson));

    return res.status(201).json({
      message: "Booking successful",
      bookingId: bookingId++,
      movieTitle: movie.title,
      showTime: show.time,
      seats: seats,
      totalAmount: seats * show.pricePerSeat,
    });
  }

  res.json({
    message: "Not enough seats available",
  });
});

app.get("/bookings/:userId", (req, res) => {
  const userId = res.params.userId;
  const user = datajson.users.find((user) => user.id == userId);

  if (user) {
    return res.status(200).json({
      allbookings: user.bookings,
    });
  }

  res.json({
    message: "something wrong",
  });
});

app.get("/bookings/:userId/:bookingId", (req, res) => {
  const { userId, bookingId } = req.params;
  const user = datajson.users.find((user) => user.id == userId);
  const booking = user.find((user) => {
    user.bookingId == bookingId;
  });

  if (booking) {
    return res.json({
      message: booking,
    });
  }
  res.status(404)({
    message: "Booking not found",
  });
});

app.put("/bookings/:userId/:bookingId", (req, res) => {
  const { userId, bookingId } = req.params;
  const { seats } = req.body;

  const user = datajson.users.find((user) => user.id == userId);
  const booking = user.bookings.find(
    (booking) => booking.bookingId == bookingId
  );

  const movie = datajson.movies.find((movie) => movie.id == booking.movieId);
  const show = movie.shows.find((show) => show.showId == booking.showId);

  if (show.availableSeats + booking.seats >= seats) {
    show.availableSeats = show.availableSeats - seats;
    booking.seats = seats;
    booking.totalAmount = seats * show.pricePerSeat;
  }

  fs.writeFileSync("data.txt", JSON.stringify(datajson));

  res.status(200).json({
    message: "Booking updated successfully",
    bookingId: bookingId,
    seats: seats,
    totalAmount: booking.totalAmount,
  });
});

app.delete("/bookings/:userId/:bookingId", (req, res) => {
  const { userId, bookingId } = req.params;

  const user = datajson.users.find((user) => user.id == userId);
  const booking = user.bookings.find(
    (booking) => (booking.bookingId = bookingId)
  );
  const movie = datajson.movies.find((movie) => movie.id == booking.movieId);
  const show = movie.find((show) => show.showId == booking.showId);

  show.availableSeats = show.availableSeats + booking.seats;
  booking.status = "cancelled";
  fs.writeFileSync("data.txt", JSON.stringify(datajson));

  res.status(200).json({
    message: "Booking cancelled successfully",
  });
});

app.get("/summary/:userId", (req, res) => {
  const { userId } = req.params;
  const user = datajson.users.find((user) => user.id == userId);
  let ans1 = 0;
  let ans2 = 0;
  let ans3 = 0;
  for (let i = 0; i < user.booking.length; i++) {
    if (user.bookings[i].status == "confirmed") {
      ans1 = ans1 + user.bookings[i].totalAmount;
      ans2 = ans2++;
      ans4 = ans4 + user.bookings[i].seats;
    }
    if (user.bookings[i].status == "cancelled") {
      ans3++;
    }
  }
  if (user) {
    return res.json({
      userId: userId,
      username: user.username,
      totalBookings: user.bookings.length + 1,
      totalAmountSpent: ans1,
      confirmedBookings: ans2,
      cancelledBookings: ans3,
      totalSeatsBooked: ans4,
    });
  }
  res.json({
    message: "something wrong",
  });
});

app.listen(PORT, () => {
  console.log("listening");
})