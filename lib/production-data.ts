import { type Asset, type ChecklistItem, type Project, type ProjectTemplate } from "@/types/production"

export const PRODUCTION_PROJECTS: Project[] = [
  {
    id: "proj-brief-001",
    title: "Product Launch Teaser",
    client: "Photonix",
    status: "IN_PROGRESS",
    dueDate: "2025-03-05",
  },
  {
    id: "proj-storyboard-002",
    title: "Summer Campaign Storyboard",
    client: "Luma Creative",
    status: "REVIEW",
    dueDate: "2025-02-20",
  },
  {
    id: "proj-shotlist-003",
    title: "Corporate Culture Documentary",
    client: "BrnoTech",
    status: "TODO",
    dueDate: "2025-04-12",
  },
  {
    id: "proj-brief-004",
    title: "Animated Explainer Refresh",
    client: "Healthify",
    status: "DONE",
    dueDate: "2025-01-18",
  },
]

export const PRODUCTION_ASSETS: Asset[] = [
  {
    id: "asset-001",
    projectId: "proj-brief-001",
    kind: "video",
    url: "https://cdn.videohub.dev/photonix/teaser-v1.mp4",
    note: "First motion test with logo animation",
    version: 1,
  },
  {
    id: "asset-002",
    projectId: "proj-brief-001",
    kind: "image",
    url: "https://cdn.videohub.dev/photonix/styleframe-02.jpg",
    note: "Key visual for color palette approval",
    version: 2,
  },
  {
    id: "asset-003",
    projectId: "proj-storyboard-002",
    kind: "image",
    url: "https://cdn.videohub.dev/luma/storyboard-panel-03.png",
    note: "Panel focusing on hero shot",
    version: 3,
  },
  {
    id: "asset-004",
    projectId: "proj-shotlist-003",
    kind: "other",
    url: "https://docs.videohub.dev/brnotech/interview-questions.pdf",
    note: "Approved interview questions",
    version: 1,
  },
  {
    id: "asset-005",
    projectId: "proj-brief-004",
    kind: "video",
    url: "https://cdn.videohub.dev/healthify/explainer-final.mp4",
    note: "Delivered final render",
    version: 5,
  },
]

export const PRODUCTION_CHECKLISTS: ChecklistItem[] = [
  {
    id: "check-001",
    projectId: "proj-brief-001",
    title: "Schválit kreativní brief",
    done: true,
  },
  {
    id: "check-002",
    projectId: "proj-brief-001",
    title: "Připravit produkční harmonogram",
    done: false,
  },
  {
    id: "check-003",
    projectId: "proj-storyboard-002",
    title: "Odevzdat kompletní storyboard",
    done: false,
  },
  {
    id: "check-004",
    projectId: "proj-storyboard-002",
    title: "Získat připomínky od klienta",
    done: true,
  },
  {
    id: "check-005",
    projectId: "proj-shotlist-003",
    title: "Připravit seznam lokací",
    done: false,
  },
  {
    id: "check-006",
    projectId: "proj-shotlist-003",
    title: "Zajistit natáčecí povolení",
    done: false,
  },
  {
    id: "check-007",
    projectId: "proj-brief-004",
    title: "Finální export dodaný klientovi",
    done: true,
  },
]

export const PRODUCTION_TEMPLATES: ProjectTemplate[] = [
  {
    id: "brief",
    name: "Brief",
    description: "Rychlé nastartování nové zakázky",
    checklist: [
      "Schválit kreativní brief",
      "Stanovit rozpočet a deadline",
      "Definovat cílové publikum",
    ],
  },
  {
    id: "storyboard",
    name: "Storyboard",
    description: "Vizualizace scén a přechodů",
    checklist: [
      "Shromáždit referenční materiály",
      "Připravit storyboard panely",
      "Naplánovat animace a přechody",
    ],
  },
  {
    id: "shotlist",
    name: "Shotlist",
    description: "Detailní plán natáčení",
    checklist: [
      "Určit klíčové scény",
      "Připravit seznam záběrů",
      "Zajistit štáb a techniku",
    ],
  },
]
