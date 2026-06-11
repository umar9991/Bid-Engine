import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed the Capability Library and historical bid outcomes.
 * Tuned so the sample IT-services RFP produces a realistic mix of
 * COMPLIANT / PARTIAL / MISSING results. Replace with the official
 * hackathon dataset (50 capability records + 120 bid outcomes) for the demo.
 */
async function main() {
  await prisma.capability.deleteMany();
  await prisma.bidOutcome.deleteMany();

  await prisma.capability.createMany({
    data: [
      {
        title: "ISO 27001 Information Security Management",
        description:
          "Certified information security management system covering risk assessment, access control, and continuous compliance. Holds a valid ISO 27001 certificate.",
        domain: "IT Services",
        certification: "ISO 27001",
        year: 2024,
        contractValue: 30000000,
        clientType: "Government",
      },
      {
        title: "Cloud Migration to AWS and Azure",
        description:
          "End-to-end migration of enterprise on-premise workloads and servers to AWS and Microsoft Azure public cloud, including 200+ server migrations for large clients.",
        domain: "IT Services",
        certification: "AWS Advanced Partner",
        year: 2024,
        contractValue: 55000000,
        clientType: "Enterprise",
      },
      {
        title: "24x7 Security Operations Centre (SOC)",
        description:
          "Round-the-clock managed security operations centre providing continuous monitoring, threat detection, and incident response services.",
        domain: "IT Services",
        certification: "ISO 27001",
        year: 2023,
        contractValue: 28000000,
        clientType: "Enterprise",
      },
      {
        title: "Enterprise Network Design and Deployment",
        description:
          "Eight years of experience designing and deploying large-scale corporate networks, including LAN/WAN, SD-WAN, and data centre networking for multi-site organizations.",
        domain: "IT Services",
        certification: "Cisco Gold Partner",
        year: 2022,
        contractValue: 40000000,
        clientType: "Government",
      },
      {
        title: "Disaster Recovery and Business Continuity",
        description:
          "Design and implementation of disaster recovery solutions with low Recovery Time Objective (RTO under 4 hours) and automated failover for mission-critical systems.",
        domain: "IT Services",
        certification: "ISO 22301",
        year: 2023,
        contractValue: 18000000,
        clientType: "Enterprise",
      },
      {
        title: "Certified IT Engineering Resources",
        description:
          "Pool of certified engineers and technical staff including CCNA, AWS, and Azure certified professionals available for staff augmentation.",
        domain: "IT Services",
        certification: "Mixed vendor certifications",
        year: 2024,
        contractValue: 12000000,
        clientType: "Enterprise",
      },
      {
        title: "On-site End-User Helpdesk Support",
        description:
          "Multi-city on-site and remote helpdesk and end-user support operations with presence in Karachi and Lahore, including SLA-based ticket resolution.",
        domain: "IT Services",
        certification: "ITIL",
        year: 2023,
        contractValue: 9000000,
        clientType: "Government",
      },
      {
        title: "Data Centre Setup and Server Management",
        description:
          "Design, build, and ongoing management of enterprise data centres including virtualization, storage, and server lifecycle management.",
        domain: "IT Services",
        certification: "ISO 9001",
        year: 2022,
        contractValue: 35000000,
        clientType: "Government",
      },
      {
        title: "Database Administration Services",
        description:
          "Managed administration of Oracle, SQL Server, and PostgreSQL databases including performance tuning, backups, and high availability.",
        domain: "IT Services",
        certification: "Oracle Certified",
        year: 2023,
        contractValue: 14000000,
        clientType: "Enterprise",
      },
      {
        title: "ERP Implementation and Support",
        description:
          "Implementation, customization, and support of enterprise resource planning systems for finance, HR, and procurement modules.",
        domain: "IT Services",
        certification: "SAP Partner",
        year: 2022,
        contractValue: 48000000,
        clientType: "Enterprise",
      },
    ],
  });

  // Historical bid outcomes (feeds win-probability). Weighted so IT Services
  // shows a credible ~60% win rate.
  const rows: { domain: string; outcome: string; bidValue: number; evalScore: number }[] = [];
  const seed = [
    ["IT Services", 0.6, 25],
    ["Construction", 0.45, 20],
    ["Logistics", 0.5, 15],
  ] as const;
  for (const [domain, winRate, n] of seed) {
    for (let i = 0; i < n; i++) {
      const won = Math.random() < winRate;
      rows.push({
        domain,
        outcome: won ? "WON" : "LOST",
        bidValue: Math.round(10_000_000 + Math.random() * 100_000_000),
        evalScore: Math.round(50 + Math.random() * 50),
      });
    }
  }
  await prisma.bidOutcome.createMany({ data: rows });

  console.log(`Seeded 10 capabilities and ${rows.length} bid outcomes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());