const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const register = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  // Validasi input
  if (!name || !email || !password || !phoneNumber) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Cek apakah email atau phoneNumber sudah terdaftar
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
      },
    });
    if (existingUser) {
      return res.status(400).json({
        error:
          existingUser.email === email
            ? "Email is already taken"
            : "Phone number is already taken",
      });
    }

    // Simpan password tanpa hashing (TIDAK AMAN)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password, // Password disimpan langsung tanpa hashing
        phoneNumber,
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Email or phone number already exists",
      });
    }
    console.error(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};

const login = async (req, res) => {
  const { email, phoneNumber, password } = req.body;

  // Validasi input
  if ((!email && !phoneNumber) || !password) {
    return res
      .status(400)
      .json({ error: "Email or phone number and password are required" });
  }

  try {
    // Cari user berdasarkan email atau phoneNumber
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phoneNumber: phoneNumber || undefined },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Alamat email tidak terdaftar" });
    }

    // Cek apakah password cocok secara langsung (TIDAK AMAN)
    if (user.password !== password) {
      return res.status(400).json({ error: "Maaf, kata sandi salah" });
    }

    // Hapus password dari data yang dikirimkan ke user
    const { password: _, ...userData } = user;

    res.status(200).json({
      message: "Login successful",
      data: userData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};

module.exports = {
  register,
  login,
};
