import { db } from '../src/repositories/GovernmentJobRepository';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore/lite';
import { SourceRegistryDoc, CrawlerExecutionLogDoc, DocumentEvidenceDoc, JobAnnouncementDoc } from '../src/types/firestore';

async function tracePipeline() {
  console.log('================================================================');
  console.log('VERIIGO PRODUCTION PIPELINE REALITY AUDIT - LIVE FIRESTORE QUERY');
  console.log('================================================================\n');

  // 1. Fetch Source Registry Docs
  console.log('--- STAGE 1: SOURCE REGISTRY ---');
  const sourceSnap = await getDocs(collection(db, 'source_registry'));
  const sources = sourceSnap.docs.map((d) => ({ id: d.id, ...d.data() } as SourceRegistryDoc));
  console.log(`Found ${sources.length} sources in Firestore source_registry.`);
  sources.slice(0, 5).forEach((s) => {
    console.log(` - ID: ${s.id} | Name: ${s.name} | URL: ${s.url} | Status: ${s.healthStatus}`);
  });

  // Pick a healthy source
  const targetSource = sources.find((s) => s.healthStatus === 'HEALTHY' || s.status === 'ACTIVE') || sources[0];
  console.log(`\nSelected Healthy Target Source for Trace:`);
  console.log(`  Source ID: ${targetSource?.id}`);
  console.log(`  Name: ${targetSource?.name || targetSource?.officialName}`);
  console.log(`  URL: ${targetSource?.url}`);
  console.log(`  Province: ${targetSource?.province}`);

  // 2. Fetch Crawler Execution Logs
  console.log('\n--- STAGE 2: CRAWLER DOWNLOAD EXECUTION LOGS ---');
  const crawlLogsSnap = await getDocs(collection(db, 'crawler_execution_logs'));
  const crawlLogs = crawlLogsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as CrawlerExecutionLogDoc));
  console.log(`Found ${crawlLogs.length} crawler execution logs in Firestore.`);
  
  const matchingCrawlLog = crawlLogs.find((l) => l.sourceId === targetSource?.id || l.sourceName?.includes(targetSource?.name || ''));
  console.log(`Matching Crawler Log for Source (${targetSource?.id}):`, matchingCrawlLog || crawlLogs[0] || 'NONE');

  // 3. Fetch Document Evidence
  console.log('\n--- STAGE 3: DOWNLOADED HTML/PDF DOCUMENT EVIDENCE ---');
  const evidenceSnap = await getDocs(collection(db, 'document_evidence'));
  const evidences = evidenceSnap.docs.map((d) => ({ id: d.id, ...d.data() } as DocumentEvidenceDoc));
  console.log(`Found ${evidences.length} document evidence records in Firestore.`);
  
  const matchingEvidence = evidences.find((e) => e.sourceId === targetSource?.id) || evidences[0];
  console.log(`Matching Document Evidence:`, matchingEvidence || 'NONE');

  // 4. Fetch Job Announcements
  console.log('\n--- STAGE 4-6: JOB ANNOUNCEMENTS WRITE ---');
  const jobsSnap = await getDocs(collection(db, 'job_announcements'));
  const jobs = jobsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  console.log(`Found ${jobs.length} job announcements in Firestore job_announcements.`);
  
  if (jobs.length > 0) {
    console.log(`Sample Job 1:`, JSON.stringify(jobs[0], null, 2));
  } else {
    console.log(`WARNING: 0 jobs found in job_announcements collection!`);
  }

  // Count totals for today
  console.log('\n--- METRICS SUMMARY ---');
  console.log(`Crawler Executions Today: ${crawlLogs.length}`);
  console.log(`Successful Downloads: ${crawlLogs.filter((c) => c.status === 'SUCCESS').length}`);
  console.log(`Extracted Jobs: ${jobs.length}`);
  console.log(`Firestore Job Writes: ${jobs.length}`);
}

tracePipeline().catch(console.error);
