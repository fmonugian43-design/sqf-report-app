import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const GMAIL_USER = "fmonugian43@gmail.com";
const GMAIL_APP_PASSWORD = "lqxe pnbd tvgv yyvs";
const OUTPUT_DIR = "/Volumes/MAC MINI/New Castle Beverage /CIP Reports";

// Ensure output folder exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created folder: ${OUTPUT_DIR}`);
}

async function downloadCIPReports() {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
    logger: false,
  });

  try {
    await client.connect();
    console.log("Connected to Gmail");

    const lock = await client.getMailboxLock("INBOX");

    try {
      // Search for unread emails with "CIP Report" in subject
      const messages = client.fetch(
        { seen: false, subject: "CIP Report" },
        { source: true, uid: true }
      );

      let count = 0;

      for await (const msg of messages) {
        const parsed = await simpleParser(msg.source);

        if (!parsed.attachments || parsed.attachments.length === 0) {
          continue;
        }

        for (const attachment of parsed.attachments) {
          if (
            attachment.contentType === "application/pdf" ||
            attachment.filename?.endsWith(".pdf")
          ) {
            const filename = attachment.filename || `CIP-Report-${Date.now()}.pdf`;
            const filepath = join(OUTPUT_DIR, filename);

            // Skip if already downloaded
            if (existsSync(filepath)) {
              console.log(`Already exists, skipping: ${filename}`);
              continue;
            }

            writeFileSync(filepath, attachment.content);
            console.log(`Saved: ${filepath}`);
            count++;
          }
        }

        // Mark email as read
        await client.messageFlagsAdd({ uid: msg.uid }, ["\\Seen"], { uid: true });
      }

      console.log(`Done. Downloaded ${count} new CIP report(s).`);
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

downloadCIPReports();
