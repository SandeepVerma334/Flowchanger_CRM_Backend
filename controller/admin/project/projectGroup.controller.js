// import prisma from "../../../prisma/prisma.js";
// import checkAdmin from "../../../utils/adminChecks.js";
// import { getIoInstance } from "../../../utils/socket.js";
// import jwt from "jsonwebtoken";


// // ✅ Create Room (Only Admin)
// const createProjectGroup = async (req, res, next) => {
//     try {
//         const { name, userIds } = req.body;
//         const admin = await checkAdmin(req.userId);

//         if (admin.error) return next({ status: 404, message: admin.message });
//         if (admin.user.role !== "ADMIN") return next({ status: 403, message: "Only Admins can create rooms" });

//         userIds.push(req.userId); // Ensure creator is in the group

//         const room = await prisma.projectGroup.create({
//             data: {
//                 name,
//                 users: { connect: userIds.map((id) => ({ id })) },
//                 createdBy: req.userId,
//             },
//             include: { users: true },
//         });

//         res.status(201).json({ message: "Room created successfully", room });
//     } catch (error) {
//         next(error);
//     }
// };

// // ✅ List Users in a Room
// const listProjectGroupUsers = async (req, res, next) => {
//     try {
//         const { roomId } = req.params;
//         const room = await prisma.projectGroup.findUnique({
//             where: { id: roomId },
//             include: { users: { select: { id: true, name: true, role: true } } },
//         });

//         if (!room) return next({ status: 404, message: "Room not found" });

//         res.status(200).json({ users: room.users });
//     } catch (error) {
//         next(error);
//     }
// };


// // ✅ Fetch Chat History
// const getMessages = async (req, res, next) => {
//     const { roomId } = req.params;
//     try {
//         const messages = await prisma.message.findMany({
//             where: { roomId },
//             include: { sender: true },
//             orderBy: { createdAt: "asc" },
//         });

//         res.json(messages);
//     } catch (error) {
//         next(error);
//     }
// };

// // ✅ Send Message via API
// const sendMessage = async (req, res, next) => {
//     try {
//         const { roomId } = req.params;
//         const { message, receiverId } = req.body;

//         // Extract sender ID from JWT token
//         const token = req.headers.authorization?.split(" ")[1];
//         if (!token) {
//             return res.status(401).json({ error: "Unauthorized" });
//         }

//         const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
//         const senderId = decodedToken.id;

//         if (!message || !receiverId) {
//             return res.status(400).json({ error: "Message and receiver ID are required" });
//         }

//         // Check if the room exists
//         const room = await prisma.projectGroup.findUnique({ where: { id: roomId } });
//         if (!room) {
//             return res.status(404).json({ error: "Room not found" });
//         }

//         // Save message in the database
//         const newMessage = await prisma.message.create({
//             data: {
//                 text: message,
//                 sender: {
//                     connect: { id: senderId }
//                 },
//                 reciver: {
//                     connect: { id: receiverId }
//                 },
//                 ProjectGroup: {
//                     connect: { id: roomId }
//                 },
//             },
//         });

//         // Emit real-time message via Socket.IO
//         const io = getIoInstance();
//         io.to(roomId).emit("message_received", {
//             message: newMessage.content,
//             senderId,
//             receiverId
//         });

//         return res.status(201).json({ message: "Message sent successfully", newMessage });
//     } catch (error) {
//         console.error("Error sending message:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// };


// export { getMessages, sendMessage, createProjectGroup, listProjectGroupUsers };