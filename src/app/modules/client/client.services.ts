import prisma from '../../utils/prisma';

interface Client {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const CreateClientOrVerify = async (client: Client) => {
  const data = {
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    phone: client.phone,
  };

  const existingClient = await prisma.client.findUnique({
    where: { email: client.email },
  });

  if (existingClient) {
    return {
      id: existingClient.id,
      fistName: existingClient.firstName,
      lastName: existingClient.lastName,
      email: existingClient.email,
      phone: existingClient.phone,
      isExisting: true,
    };
  }

  const newClient = await prisma.client.create({
    data,
  });

  return {
    id: newClient.id,
    firstName: newClient.firstName,
    lastName: newClient.lastName,
    email: newClient.email,
    phone: newClient.phone,
    isExisting: false,
  };
};

const ClientService = { CreateClientOrVerify };

export default ClientService;
