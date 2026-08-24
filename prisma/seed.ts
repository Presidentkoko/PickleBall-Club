import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Roles ────────────────────────────────────────────────
  const roleData = [
    { name: "OWNER", description: "Club owner — full access to everything" },
    { name: "SUPER_ADMIN", description: "Super Admin — full access including admin management" },
    { name: "ADMIN", description: "Administrator — manage the club" },
    { name: "STAFF", description: "Staff — assist with bookings and events" },
    { name: "MEMBER", description: "Club member" },
  ];
  for (const r of roleData) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "ADMIN" } });
  const ownerRole = await prisma.role.findUniqueOrThrow({ where: { name: "OWNER" } });
  const memberRole = await prisma.role.findUniqueOrThrow({ where: { name: "MEMBER" } });

  // ── Admin account (spec: username "admin123" / password "admin123") ──
  const admin = await prisma.user.upsert({
    where: { username: "admin123" },
    update: {},
    create: {
      email: "admin@svpc.local",
      username: "admin123",
      passwordHash: await bcrypt.hash("admin123", 10),
      firstName: "SVPC",
      lastName: "Admin",
      roleId: adminRole.id,
      emailVerified: true,
    },
  });

  // ── Owner account ────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "owner@svpc.local" },
    update: {},
    create: {
      email: "owner@svpc.local",
      username: "owner",
      passwordHash: await bcrypt.hash("owner123", 10),
      firstName: "SVPC",
      lastName: "Owner",
      roleId: ownerRole.id,
      emailVerified: true,
    },
  });

  // ── Demo member (for testing the member experience) ──────
  await prisma.user.upsert({
    where: { email: "member@svpc.local" },
    update: {},
    create: {
      email: "member@svpc.local",
      username: "member",
      passwordHash: await bcrypt.hash("member123", 10),
      firstName: "Demo",
      lastName: "Member",
      roleId: memberRole.id,
      emailVerified: true,
      skillLevel: "INTERMEDIATE",
      gender: "PREFER_NOT_TO_SAY",
    },
  });

  // ── Courts ───────────────────────────────────────────────
  for (let i = 1; i <= 4; i++) {
    await prisma.court.upsert({
      where: { name: `Court ${i}` },
      update: {},
      create: { name: `Court ${i}`, isIndoor: i <= 2, status: "AVAILABLE" },
    });
  }

  // ── Settings (key/value store) ───────────────────────────
  const settings: {
    key: string;
    category: string;
    description: string;
    value: Prisma.InputJsonValue;
  }[] = [
    {
      key: "club.info",
      category: "club",
      description: "General club information",
      value: {
        name: "San Vicente Pickleball Club",
        shortName: "SVPC",
        tagline: "Rallying Since '25",
        email: "hello@svpc.com",
        phone: "+63 900 000 0000",
        address: "San Vicente, Philippines",
        logoUrl: "/logo.png",
      },
    },
    {
      key: "club.hours",
      category: "hours",
      description: "Operating hours",
      value: {
        monday: { open: "06:00", close: "22:00" },
        tuesday: { open: "06:00", close: "22:00" },
        wednesday: { open: "06:00", close: "22:00" },
        thursday: { open: "06:00", close: "22:00" },
        friday: { open: "06:00", close: "23:00" },
        saturday: { open: "07:00", close: "23:00" },
        sunday: { open: "07:00", close: "21:00" },
      },
    },
    {
      key: "membership.fees",
      category: "fees",
      description: "Membership fees by type (PHP)",
      value: { MONTHLY: 500, QUARTERLY: 1400, SEMI_ANNUAL: 2600, ANNUAL: 5000 },
    },
    {
      key: "payment.accounts",
      category: "payment",
      description: "Manual payment accounts for GCash and bank transfer",
      value: {
        gcash: { name: "SVPC", number: "0900 000 0000" },
        bank: {
          bankName: "BDO",
          accountName: "San Vicente Pickleball Club",
          accountNumber: "0000 0000 0000",
        },
      },
    },
    {
      key: "booking.rules",
      category: "rules",
      description: "Court booking rules",
      value: { minHours: 1, maxHours: 3, pricePerHour: 300, advanceDays: 14 },
    },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, category: s.category, description: s.description },
      create: s,
    });
  }

  // ── Demo announcements (only when none exist) ────────────
  if ((await prisma.announcement.count()) === 0) {
    await prisma.announcement.createMany({
      data: [
        {
          title: "Welcome to San Vicente Pickleball Club!",
          content:
            "Our new club portal is live. Register your membership, join open play, and compete in tournaments — all in one place.",
          type: "NEWS",
          isPinned: true,
          isPublished: true,
          publishedAt: new Date(),
          authorId: admin.id,
        },
        {
          title: "Weekend Open Play — All Levels Welcome",
          content:
            "Join us this Saturday for casual open play. Rotating partners, friendly games, beginners encouraged!",
          type: "EVENT",
          isPublished: true,
          publishedAt: new Date(),
          authorId: admin.id,
        },
      ],
    });
  }

  // ── Demo open play (only when none exist) ────────────────
  if ((await prisma.openPlay.count()) === 0) {
    const start = new Date();
    start.setDate(start.getDate() + 3);
    start.setHours(18, 0, 0, 0);
    const end = new Date(start);
    end.setHours(20, 0, 0, 0);
    await prisma.openPlay.create({
      data: {
        title: "Friday Night Open Play",
        description: "Casual games, rotating partners, all skill levels.",
        date: start,
        startTime: start,
        endTime: end,
        venue: "SVPC Main Courts",
        maxPlayers: 16,
        fee: "150.00",
        status: "OPEN",
        createdById: admin.id,
      },
    });
  }

  console.log(
    "✅ Seed complete.\n   Admin  → username: admin123 / password: admin123\n   Owner  → owner@svpc.local / owner123\n   Member → member@svpc.local / member123",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
