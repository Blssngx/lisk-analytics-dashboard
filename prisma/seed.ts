import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
	await prisma.token.create({
		data: {
			name: "LZAR",
			symbol: "LZAR",
			contractAddress: "0x7b7047c49eaf68b8514a20624773ca620e2cd4a3",
			createdAt: new Date("2025-10-17T11:59:00.000Z"),
			updatedAt: new Date("2025-10-17T11:59:00.000Z"),
		},
	});
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
