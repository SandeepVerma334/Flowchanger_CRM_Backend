const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getOneOnOneChat = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // console.log(id, req.userId);

    const user1 = await prisma.user.findFirst({ where: { id } });
    const user2 = await prisma.user.findFirst({ where: { id: req.userId } });
    if (!user1 || !user2) {
      return res.status(404).json({ message: "One or both users not found" });
    }
    let chatRoom = await prisma.chatRoom.findFirst({
      where: {
        isGroup: false,
        users: {
          every: {
            OR: [{ id }, { id: req.userId }],
          },
        },
      },
      include: {
        messages: {
          include: {
            sender: {
              select: { id: true, name: true },
            },
          },
          orderBy: { timestamp: "asc" },
        },
        users: {
          select: { id: true, name: true },
        },
      },
    });

    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: {
          isGroup: false,
          users: {
            connect: [{ id }, { id: req.userId }],
          },
        },
        include: {
          messages: {
            include: {
              sender: {
                select: { id: true, name: true },
              },
            },
          },
          users: {
            select: { id: true, name: true },
          },
        },
      });
    }

    chatRoom.userId = req.userId;
    res.status(200).json(chatRoom);
  } catch (error) {
    console.error("Error fetching or creating one-on-one chat:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createGroupChat = async (req, res) => {
  try {
    const { name, userIds } = req.body;
    // console.log(req.body);

    if (!name || !userIds || userIds.length < 1) {
      return res.status(400).json({ message: "Name and userIds are required" });
    }

    const chatRoom = await prisma.chatRoom.create({
      data: {
        name,
        isGroup: true,
        users: {
          connect: userIds.map((id) => ({ id })),
        },
      },
      include: {
        users: true,
      },
    });

    res.status(201).json(chatRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create group chat" });
  }
};

module.exports = { getOneOnOneChat, createGroupChat };
