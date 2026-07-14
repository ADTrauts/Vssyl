# AI Platform Canonical Diagram

**Program:** AI Architecture Phase 6B  
**Date:** 2026-07-13  
**Status:** Active — **canonical** whole-platform relationship diagram  
**Owner:** AI Platform / Architecture council  
**Source of Truth for:** One-page AI Platform topology  
**Companion:** [`AI_PLATFORM_ARCHITECTURE_CERTIFICATION.md`](./AI_PLATFORM_ARCHITECTURE_CERTIFICATION.md) · [`AI_PLATFORM_OVERVIEW.md`](./AI_PLATFORM_OVERVIEW.md)

---

## Master diagram

```mermaid
flowchart TB
  subgraph Actors
    U[User / Personal]
    B[Business Member]
    Op[Platform Operator / Admin]
  end

  subgraph Surfaces
    PC[Personal AI Chat / Twin UI]
    BA[Business AI UI]
    Hub[AI Pipeline Hub<br/>/admin-portal/ai-pipeline]
  end

  subgraph TwinRuntime["Shared Twin Runtime"]
    Svc[DigitalLifeTwinService]
    Core[DigitalLifeTwinCore]
    Biz[BusinessAIDigitalTwinService]
    Reason[Conversation Reasoning]
  end

  subgraph ContextLayer["Context & Knowledge"]
    Orch[ContextProviderOrchestrator]
    Asm[AIContextAssembler]
    Mem[User Memory Facts]
    KE[Knowledge Engine<br/>server/src/knowledge]
    Graph[Context Graph]
    Ground[Pipeline Grounding]
  end

  subgraph ExecutionLayer["Execution & Safety"]
    Tools[toolExecutor]
    Gov[governedToolExecutor]
    Risk[aiToolRiskRegistry]
    Appr[Approvals]
    AE[ActionExecutor<br/>post-hoc / bridged]
    Ledger[AIActionExecution]
  end

  subgraph Providers["Providers"]
    Route[providerRouting + modelCatalog]
    Shadow[Model Router shadow<br/>Phase 7]
    Fac[aiProviderFactory]
    OAI[OpenAI]
    Ant[Anthropic]
    Loc[Local / Fake]
  end

  subgraph SkillsLayer["Skills (Phase 8)"]
    SkillAPI["/api/ai/skills"]
    SkillRun[skillRunner]
    SkillReg[skillRegistry]
    SkillAdapters[Module adapters]
  end

  subgraph Intelligence["Observe → Improve"]
    Obs[Observation Events]
    Rec[AIExecutionRecord]
    Eval[Evaluation Workflow]
    Corr[Correction Proposals]
    Reg[Regression Library]
    Replay[Replay Prepare only]
  end

  subgraph OpsAPI["Operations API"]
    Ops[/api/admin/ai/operations]
  end

  U --> PC
  B --> BA
  Op --> Hub

  PC --> Svc
  BA --> Biz
  Biz --> Core
  Svc --> Core

  Core --> Reason
  Core --> Orch
  Core --> Asm
  Core --> Ground
  Core --> Mem
  Orch --> KE
  KE --> Graph
  Ground --> Graph

  Core --> Route
  Route --> Fac
  Route -.->|shadow observe| Shadow
  Fac --> OAI
  Fac --> Ant
  Fac --> Loc

  PC --> SkillAPI
  BA --> SkillAPI
  SkillAPI --> SkillRun
  SkillRun --> SkillReg
  SkillRun --> SkillAdapters
  SkillRun --> Obs
  SkillRun -.->|shadow observe| Shadow
  SkillAdapters --> Route

  Core --> Tools
  Tools --> Gov
  Gov --> Risk
  Gov --> Ledger
  Gov --> Appr
  Core --> AE
  AE -.->|bridge| Gov

  Core --> Obs
  Obs --> Rec
  Rec --> Eval
  Eval --> Corr
  Corr --> Reg
  Rec --> Replay

  Hub --> Ops
  Ops --> Rec
  Ops --> Eval
  Ops --> Corr
  Ops --> Reg
  Ops --> Obs
  Hub --> SkillReg
```

---

## Skills relationship rules (Phase 8)

| From | To | Rule |
|------|----|------|
| Skill runner | Twin Core | **No** invocation — dedicated execution path |
| Skill runner | Module adapters | Wraps authorized SoR services |
| Skill runner | Observation | `surface: SKILL` events + optional execution record |
| Skill runner | Model Router shadow | Observe-only; production routing unchanged |
| Intent type | Skill | Selection hint only — explicit `skillKey` authoritative on customer API |
| Capability | Provider | Skills declare capability; adapters choose models today |

---

## Relationship rules (canonical)

| From | To | Rule |
|------|----|------|
| Modules | Context providers | Modules expose data; Twin orchestrates |
| Knowledge Engine | Answers | Composition may influence; does not own Twin |
| Observation | Runtime | Emit-only; never changes Twin behavior |
| Evaluation / Correction | Runtime | Proposals only; never auto-mutate prompts/routing/tools |
| Pipeline Hub | Operations API | One operator product; redirects preserve old URLs |
| Business Twin | Core | Scoped policy wrapper over shared runtime |
| Providers | Product logic | Adapters only; policy belongs to Vssyl |

---

## Non-relationships (intentional)

- Corrections do **not** write into Twin prompts or provider selection.  
- Replay prepare does **not** re-execute production traffic.  
- Admin Pipeline does **not** own module SoR data.  
- Skills runner does **not** fork Twin Core or open tool mutation rounds (Phase 8 pilots).  
- Analytics orphan scaffolds are **not** part of this diagram.
