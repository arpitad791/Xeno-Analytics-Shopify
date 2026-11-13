// Creates (or resets) a read-only demo login that sees the same store as an
// existing owner account. Useful for sharing the live dashboard with reviewers.
//
// Usage (from xeno-backend, with DATABASE_URL pointing at the database):
//   node scripts/create-demo-user.js <ownerEmail> <demoEmail> <demoPassword>
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const [, , ownerEmail, demoEmail, demoPassword] = process.argv;
  if (!ownerEmail || !demoEmail || !demoPassword) {
    console.error(
      "Usage: node scripts/create-demo-user.js <ownerEmail> <demoEmail> <demoPassword>"
    );
    process.exit(1);
  }
  if (demoPassword.length < 6) {
    console.error("Demo password must be at least 6 characters.");
    process.exit(1);
  }

  const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) {
    console.error("Owner account not found:", ownerEmail);
    process.exit(1);
  }

  const password = await bcrypt.hash(demoPassword, 10);
  const demo = await prisma.user.upsert({
    where: { email: demoEmail },
    update: { password, tenantId: owner.tenantId, role: "VIEWER", isActive: true },
    create: {
      email: demoEmail,
      password,
      firstName: "Demo",
      lastName: "User",
      tenantId: owner.tenantId,
      role: "VIEWER",
      isActive: true,
    },
  });

  console.log(`Demo login ready: ${demo.email} (read-only, same store as ${ownerEmail})`);
}

main()
  .catch((err) => {
    console.error("Failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
