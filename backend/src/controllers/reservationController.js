const Reservation = require('../models/Reservation');
const sendEmail = require('../config/nodemailer');

// @desc    Create a new reservation
// @route   POST /api/reservations
// @access  Public (Optional auth)
exports.createReservation = async (req, res, next) => {
  try {
    const { name, email, phone, date, time, guests, message } = req.body;
    const userId = req.user ? req.user.id : null;

    const reservation = await Reservation.create({
      user: userId,
      name,
      email,
      phone,
      date,
      time,
      guests,
      message,
    });

    // Send confirmation email to guest
    const emailMessage = `
      Dear ${name},
      
      Thank you for choosing Annapurna Kitchen! 🏔️
      
      Your reservation request has been received for:
      Date: ${date}
      Time: ${time}
      Guests: ${guests}
      Status: Pending Confirmation
      
      We look forward to serving you authentic Himalayan flavors.
      
      Warm regards,
      The Annapurna Kitchen Team
    `;

    await sendEmail({
      email: reservation.email,
      subject: 'Annapurna Kitchen - Reservation Received',
      message: emailMessage,
    });

    res.status(201).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private (Staff/Manager/Admin)
exports.getReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find().sort('-createdAt');
    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user reservations
// @route   GET /api/reservations/me
// @access  Private (Customer)
exports.getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update reservation status
// @route   PUT /api/reservations/:id/status
// @access  Private (Staff/Manager/Admin)
exports.updateReservationStatus = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    reservation.status = req.body.status; // 'confirmed', 'cancelled', etc.
    await reservation.save();

    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update reservation
// @route   PUT /api/reservations/:id
// @access  Private
exports.updateReservation = async (req, res, next) => {
  try {
    let reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    const isStaff = ['admin', 'manager', 'staff'].includes(req.user.role);
    const isOwner = reservation.user && reservation.user.toString() === req.user.id;

    if (!isOwner && !isStaff) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this reservation' });
    }

    // Prevent update if already confirmed
    if (reservation.status === 'confirmed' && !isStaff) {
      return res.status(400).json({ success: false, message: 'Confirmed reservations cannot be modified. Please contact the restaurant.' });
    }

    const allowedUpdates = isStaff
      ? req.body
      : {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          date: req.body.date,
          time: req.body.time,
          guests: req.body.guests,
          message: req.body.message,
        };

    reservation = await Reservation.findByIdAndUpdate(req.params.id, allowedUpdates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};
