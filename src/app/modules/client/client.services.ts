// import prisma from '../../utils/prisma';
// import { Gender } from '@prisma/client';

// interface Client {
//   first_name: string;
//   last_name: string;
//   email: string;
//   phone: string;
//   date_of_birth: Date;
//   gender: Gender;
// }

// const CreateClientOrVerify = async (client: Client) => {
//   const data = {
//     first_name: client.first_name,
//     last_name: client.last_name,
//     email: client.email,
//     phone: client.phone,
//     date_of_birth: client.date_of_birth,
//     gender: client.gender,
//   };

//   const existingClient = await prisma.client.findUnique({
//     where: { email: client.email },
//   });

//   if (existingClient) {
//     return {
//       id: existingClient.id,
//       first_name: existingClient.first_name,
//       last_name: existingClient.last_name,
//       email: existingClient.email,
//       phone: existingClient.phone,
//       date_of_birth: existingClient.date_of_birth,
//       gender: existingClient.gender,
//       is_verified: existingClient.is_verified,
//       isExisting: true,
//     };
//   }

//   const newClient = await prisma.client.create({
//     data,
//   });

//   return {
//     id: newClient.id,
//     first_name: newClient.first_name,
//     last_name: newClient.last_name,
//     email: newClient.email,
//     phone: newClient.phone,
//     date_of_birth: newClient.date_of_birth,
//     gender: newClient.gender,
//     is_verified: newClient.is_verified,
//     isExisting: false,
//   };
// };

// const GetClientById = async (id: string) => {
//   const client = await prisma.client.findUnique({
//     where: { id },
//     select: {
//       id: true,
//       first_name: true,
//       last_name: true,
//       email: true,
//       phone: true,
//       date_of_birth: true,
//       gender: true,
//       is_verified: true,
//       created_at: true,
//       updated_at: true,
//     },
//   });

//   return client;
// };

// const VerifyClient = async (id: string) => {
//   // const updatedClient = await prisma.client.update({
//   //   where: { id },
//   //   data: { is_verified: true },
//   //   select: {
//   //     id: true,
//   //     first_name: true,
//   //     last_name: true,
//   //     email: true,
//   //     phone: true,
//   //     is_verified: true,
//   //   },
//   // });

//   return {};
// };

// const ClientService = {
//   CreateClientOrVerify,
//   GetClientById,
//   VerifyClient,
// };

// export default ClientService;
