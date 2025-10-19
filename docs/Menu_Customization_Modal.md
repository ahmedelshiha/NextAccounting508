Menu Customization Modal - Implementation Guidelines
Project: NextAccounting Admin Dashboard - Menu Customization Feature
Document Version: 1.0
Date: October 19, 2025
Author: Senior Web Developer
Status: Implementation Ready

Table of Contents

Executive Summary
Feature Overview
Technical Architecture
Database Schema
Component Structure
Drag-and-Drop Implementation
State Management
API Endpoints
Backend Implementation
Frontend Components
Integration with Existing Sidebar
Testing Strategy
Migration Plan
Performance Considerations
Accessibility Requirements
Security Considerations


Executive Summary
This document provides comprehensive guidelines for implementing a QuickBooks-style menu customization modal in the NextAccounting admin dashboard. The feature will allow users to:

Reorder menu sections and items via drag-and-drop
Show/hide menu items based on their workflow
Bookmark frequently used pages
Reset to default menu configuration
Persist preferences per user in the database

Estimated Timeline: 2-3 weeks
Complexity: Moderate-High
Dependencies: @dnd-kit, Prisma, Next.js API routes

Feature Overview
User Stories

As an admin user, I want to customize my sidebar menu to match my workflow
As an admin user, I want to hide menu items I don't use to reduce clutter
As an admin user, I want to reorder sections to prioritize frequently accessed pages
As an admin user, I want to bookmark specific pages for quick access
As an admin user, I want to reset to default configuration if needed

Key Features

4 Tabs: Sections, Your Books (hidden), Your Practice, Bookmarks
Drag-and-Drop: Reorder sections and menu items
Visibility Toggle: Show/hide individual items with checkboxes
Search Filter: Find pages to bookmark
Reset Function: Return to default menu structure
Persistence: Save preferences to database per user
Real-time Updates: Sidebar updates immediately on save


Technical Architecture
System Design
┌─────────────────────────────────────────────────────────────┐
│                    User Interaction Layer                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │        MenuCustomizationModal Component             │   │
│  │  ├─ SectionsTab (drag-drop sections)                │   │
│  │  ├─ YourPracticeTab (drag-drop practice items)      │   │
│  │  ├─ BookmarksTab (search + drag-drop bookmarks)     │   │
│  │  └─ Actions (Save, Cancel, Reset)                   │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   State Management Layer                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │    Zustand Store: useMenuCustomizationStore         │   │
│  │  ├─ customization: MenuCustomization                │   │
│  │  ├─ tempCustomization: MenuCustomization (draft)    │   │
│  │  ├─ isLoading: boolean                              │   │
│  │  ├─ loadCustomization()                             │   │
│  │  ├─ saveCustomization()                             │   │
│  │  └─ resetToDefaults()                               │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  GET    /api/admin/menu-customization               │   │
│  │  POST   /api/admin/menu-customization               │   │
│  │  PUT    /api/admin/menu-customization               │   │
│  │  DELETE /api/admin/menu-customization (reset)       │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Layer (Prisma)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MenuCustomization Model                            │   │
│  │  ├─ id: String (cuid)                               │   │
│  │  ├─ userId: String (FK to User)                     │   │
│  │  ├─ sectionOrder: String[] (JSON)                   │   │
│  │  ├─ hiddenItems: String[] (JSON)                    │   │
│  │  ├─ practiceItems: PracticeItem[] (JSON)            │   │
│  │  ├─ bookmarks: Bookmark[] (JSON)                    │   │
│  │  ├─ createdAt: DateTime                             │   │
│  │  └─ updatedAt: DateTime                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
Technology Stack
LayerTechnologyVersionPurposeFrontendReact19.1.0UI componentsFrameworkNext.js15.5.4App router & APIDrag-Drop@dnd-kit^6.1.0Drag-and-drop functionalityStateZustandLatestMenu customization stateDatabasePostgreSQL14+Data persistenceORMPrismaLatestDatabase accessUI ComponentsTailwind CSSLatestStylingIconsLucide ReactLatestIcons

Database Schema
Prisma Schema Addition
prisma// File: prisma/schema.prisma

model MenuCustomization {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Section ordering and visibility
  sectionOrder  Json     @default("[]")  // Array of section IDs in custom order
  hiddenItems   Json     @default("[]")  // Array of item IDs that are hidden
  
  // Your Practice tab customization
  practiceItems Json     @default("[]")  // Array of practice-specific items
  
  // Bookmarks tab
  bookmarks     Json     @default("[]")  // Array of bookmarked pages
  
  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
  @@map("menu_customizations")
}

// Update User model to include relation
model User {
  id                  String               @id @default(cuid())
  // ... existing fields
  menuCustomization   MenuCustomization?
}
JSON Structure Details
sectionOrder (String[])
json[
  "dashboard",
  "business",
  "financial",
  "operations",
  "system"
]
hiddenItems (String[])
json[
  "admin/analytics",
  "admin/reports",
  "admin/expenses"
]
practiceItems (PracticeItem[])
json[
  {
    "id": "practice-clients",
    "name": "Clients",
    "icon": "Users",
    "href": "/admin/clients",
    "order": 0,
    "visible": true
  },
  {
    "id": "practice-work",
    "name": "Work",
    "icon": "Briefcase",
    "href": "/admin/work",
    "order": 1,
    "visible": true
  }
]
bookmarks (Bookmark[])
json[
  {
    "id": "bookmark-1",
    "name": "Products & services",
    "href": "/admin/products-services",
    "icon": "Package",
    "order": 0
  },
  {
    "id": "bookmark-2",
    "name": "Reconcile",
    "href": "/admin/reconcile",
    "icon": "FileCheck",
    "order": 1
  }
]
Migration File
typescript// File: prisma/migrations/YYYYMMDDHHMMSS_add_menu_customization/migration.sql

-- CreateTable
CREATE TABLE "menu_customizations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sectionOrder" JSONB NOT NULL DEFAULT '[]',
    "hiddenItems" JSONB NOT NULL DEFAULT '[]',
    "practiceItems" JSONB NOT NULL DEFAULT '[]',
    "bookmarks" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_customizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "menu_customizations_userId_key" ON "menu_customizations"("userId");

-- CreateIndex
CREATE INDEX "menu_customizations_userId_idx" ON "menu_customizations"("userId");

-- AddForeignKey
ALTER TABLE "menu_customizations" ADD CONSTRAINT "menu_customizations_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## Component Structure

### File Organization
```
src/
├── components/
│   └── admin/
│       └── menu-customization/
│           ├── MenuCustomizationModal.tsx          # Main modal component
│           ├── MenuCustomizationTabs.tsx           # Tab navigation
│           ├── SectionsTab.tsx                     # Sections reordering tab
│           ├── YourPracticeTab.tsx                 # Practice items tab
│           ├── BookmarksTab.tsx                    # Bookmarks management tab
│           ├── DraggableItem.tsx                   # Reusable drag item
│           ├── MenuItemCheckbox.tsx                # Show/hide checkbox
│           ├── SearchFilter.tsx                    # Search input
│           └── ResetButton.tsx                     # Reset to defaults
├── stores/
│   └── admin/
│       └── menuCustomization.store.ts              # Zustand store
├── hooks/
│   └── admin/
│       ├── useMenuCustomization.ts                 # Custom hook
│       └── useMenuCustomizationModal.ts            # Modal state hook
├── lib/
│   └── menu/
│       ├── defaultMenu.ts                          # Default menu config
│       ├── menuUtils.ts                            # Helper functions
│       └── menuValidator.ts                        # Validation logic
├── types/
│   └── admin/
│       └── menuCustomization.ts                    # TypeScript types
└── app/
    └── api/
        └── admin/
            └── menu-customization/
                └── route.ts                        # API endpoints

Drag-and-Drop Implementation
Installing @dnd-kit
bashnpm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
Core DnD Setup
typescript// File: src/components/admin/menu-customization/DraggableItem.tsx

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface DraggableItemProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function DraggableItem({ id, children, disabled }: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-3 bg-white border rounded-lg
        ${isDragging ? 'shadow-lg z-50' : 'shadow-sm'}
        ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-move'}
      `}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none focus:outline-none"
        disabled={disabled}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-5 h-5 text-gray-400" />
      </button>
      {children}
    </div>
  );
}
DnD Context Wrapper
typescript// File: src/components/admin/menu-customization/SectionsTab.tsx

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableItem } from './DraggableItem';
import { MenuItemCheckbox } from './MenuItemCheckbox';

interface Section {
  id: string;
  name: string;
  visible: boolean;
}

interface SectionsTabProps {
  sections: Section[];
  onReorder: (sections: Section[]) => void;
  onToggleVisibility: (sectionId: string) => void;
}

export function SectionsTab({ sections, onReorder, onToggleVisibility }: SectionsTabProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(sections, oldIndex, newIndex);
      onReorder(reordered);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Choose what you want to see in your menu, and drag and reorder items to fit the way you work:
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sections.map((section) => (
              <DraggableItem key={section.id} id={section.id}>
                <MenuItemCheckbox
                  checked={section.visible}
                  onChange={() => onToggleVisibility(section.id)}
                  label={section.name}
                />
              </DraggableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

State Management
Zustand Store
typescript// File: src/stores/admin/menuCustomization.store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface MenuCustomization {
  sectionOrder: string[];
  hiddenItems: string[];
  practiceItems: PracticeItem[];
  bookmarks: Bookmark[];
}

export interface PracticeItem {
  id: string;
  name: string;
  icon: string;
  href: string;
  order: number;
  visible: boolean;
}

export interface Bookmark {
  id: string;
  name: string;
  href: string;
  icon: string;
  order: number;
}

interface MenuCustomizationState {
  // Current saved customization
  customization: MenuCustomization | null;
  
  // Temporary draft customization (for modal editing)
  tempCustomization: MenuCustomization | null;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  
  // Actions
  loadCustomization: () => Promise<void>;
  saveCustomization: (customization: MenuCustomization) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  setTempCustomization: (customization: MenuCustomization) => void;
  clearTempCustomization: () => void;
}

export const useMenuCustomizationStore = create<MenuCustomizationState>()(
  persist(
    (set, get) => ({
      customization: null,
      tempCustomization: null,
      isLoading: false,
      isSaving: false,

      loadCustomization: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/admin/menu-customization');
          if (response.ok) {
            const data = await response.json();
            set({ customization: data, isLoading: false });
          } else {
            // No customization exists, use defaults
            set({ customization: null, isLoading: false });
          }
        } catch (error) {
          console.error('Failed to load menu customization:', error);
          set({ isLoading: false });
        }
      },

      saveCustomization: async (customization: MenuCustomization) => {
        set({ isSaving: true });
        try {
          const response = await fetch('/api/admin/menu-customization', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customization),
          });

          if (response.ok) {
            const saved = await response.json();
            set({ 
              customization: saved, 
              tempCustomization: null, 
              isSaving: false 
            });
          } else {
            throw new Error('Failed to save customization');
          }
        } catch (error) {
          console.error('Failed to save menu customization:', error);
          set({ isSaving: false });
          throw error;
        }
      },

      resetToDefaults: async () => {
        set({ isSaving: true });
        try {
          const response = await fetch('/api/admin/menu-customization', {
            method: 'DELETE',
          });

          if (response.ok) {
            set({ 
              customization: null, 
              tempCustomization: null, 
              isSaving: false 
            });
          } else {
            throw new Error('Failed to reset customization');
          }
        } catch (error) {
          console.error('Failed to reset menu customization:', error);
          set({ isSaving: false });
          throw error;
        }
      },

      setTempCustomization: (customization: MenuCustomization) => {
        set({ tempCustomization: customization });
      },

      clearTempCustomization: () => {
        set({ tempCustomization: null });
      },
    }),
    {
      name: 'menu-customization-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist the actual customization, not temp state
        customization: state.customization,
      }),
    }
  )
);

// Selector hooks
export const useMenuCustomization = () =>
  useMenuCustomizationStore((state) => state.customization);

export const useTempMenuCustomization = () =>
  useMenuCustomizationStore((state) => state.tempCustomization);

export const useMenuCustomizationActions = () => ({
  load: useMenuCustomizationStore((state) => state.loadCustomization),
  save: useMenuCustomizationStore((state) => state.saveCustomization),
  reset: useMenuCustomizationStore((state) => state.resetToDefaults),
  setTemp: useMenuCustomizationStore((state) => state.setTempCustomization),
  clearTemp: useMenuCustomizationStore((state) => state.clearTempCustomization),
});
Custom Hook for Modal
typescript// File: src/hooks/admin/useMenuCustomizationModal.ts

import { useState, useCallback, useEffect } from 'react';
import {
  useMenuCustomization,
  useTempMenuCustomization,
  useMenuCustomizationActions,
  MenuCustomization,
} from '@/stores/admin/menuCustomization.store';
import { getDefaultMenuCustomization } from '@/lib/menu/defaultMenu';

export function useMenuCustomizationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sections' | 'practice' | 'bookmarks'>('sections');
  
  const customization = useMenuCustomization();
  const tempCustomization = useTempMenuCustomization();
  const { load, save, reset, setTemp, clearTemp } = useMenuCustomizationActions();

  // Initialize temp customization when modal opens
  useEffect(() => {
    if (isOpen && !tempCustomization) {
      const initial = customization || getDefaultMenuCustomization();
      setTemp(initial);
    }
  }, [isOpen, customization, tempCustomization, setTemp]);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    clearTemp();
    setActiveTab('sections');
  }, [clearTemp]);

  const handleSave = useCallback(async () => {
    if (!tempCustomization) return;
    
    try {
      await save(tempCustomization);
      closeModal();
    } catch (error) {
      console.error('Failed to save customization:', error);
      // Show error toast
    }
  }, [tempCustomization, save, closeModal]);

  const handleReset = useCallback(async () => {
    if (confirm('Are you sure you want to reset to default menu? This cannot be undone.')) {
      try {
        await reset();
        closeModal();
      } catch (error) {
        console.error('Failed to reset customization:', error);
        // Show error toast
      }
    }
  }, [reset, closeModal]);

  const updateTempCustomization = useCallback((updates: Partial<MenuCustomization>) => {
    if (!tempCustomization) return;
    setTemp({ ...tempCustomization, ...updates });
  }, [tempCustomization, setTemp]);

  return {
    isOpen,
    activeTab,
    tempCustomization,
    openModal,
    closeModal,
    setActiveTab,
    handleSave,
    handleReset,
    updateTempCustomization,
  };
}

API Endpoints
API Route Handler
typescript// File: src/app/api/admin/menu-customization/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const PracticeItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  href: z.string(),
  order: z.number(),
  visible: z.boolean(),
});

const BookmarkSchema = z.object({
  id: z.string(),
  name: z.string(),
  href: z.string(),
  icon: z.string(),
  order: z.number(),
});

const MenuCustomizationSchema = z.object({
  sectionOrder: z.array(z.string()),
  hiddenItems: z.array(z.string()),
  practiceItems: z.array(PracticeItemSchema),
  bookmarks: z.array(BookmarkSchema),
});

// GET: Load user's menu customization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const customization = await prisma.menuCustomization.findUnique({
      where: { userId: session.user.id },
    });

    if (!customization) {
      return NextResponse.json(
        { error: 'No customization found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sectionOrder: customization.sectionOrder,
      hiddenItems: customization.hiddenItems,
      practiceItems: customization.practiceItems,
      bookmarks: customization.bookmarks,
    });
  } catch (error) {
    console.error('GET /api/admin/menu-customization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create or update menu customization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = MenuCustomizationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error },
        { status: 400 }
      );
    }

    const { sectionOrder, hiddenItems, practiceItems, bookmarks } = validationResult.data;

    // Upsert customization
    const customization = await prisma.menuCustomization.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        sectionOrder,
        hiddenItems,
        practiceItems,
        bookmarks,
      },
      update: {
        sectionOrder,
        hiddenItems,
        practiceItems,
        bookmarks,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      sectionOrder: customization.sectionOrder,
      hiddenItems: customization.hiddenItems,
      practiceItems: customization.practiceItems,
      bookmarks: customization.bookmarks,
    });
  } catch (error) {
    console.error('POST /api/admin/menu-customization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Reset to defaults (delete customization)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await prisma.menuCustomization.delete({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // If no customization exists, that's fine
    if (error.code === 'P2025') {
      return NextResponse.json({ success: true });
    }
    
    console.error('DELETE /api/admin/menu-customization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

Backend Implementation
Default Menu Configuration
typescript// File: src/lib/menu/defaultMenu.ts

import { MenuCustomization } from '@/stores/admin/menuCustomization.store';

export const DEFAULT_SECTION_ORDER = [
  'dashboard',
  'business',
  'financial',
  'operations',
  'system',
];

export const DEFAULT_PRACTICE_ITEMS = [
  {
    id: 'practice-clients',
    name: 'Clients',
    icon: 'Users',
    href: '/admin/clients',
    order: 0,
    visible: true,
  },
  {
    id: 'practice-work',
    name: 'Work',
    icon: 'Briefcase',
    href: '/admin/work',
    order: 1,
    visible: true,
  },
  {
    id: 'practice-training',
    name: 'Training',
    icon: 'GraduationCap',
    href: '/admin/training',
    order: 2,
    visible: true,
  },
];

export function getDefaultMenuCustomization(): MenuCustomization {
  return {
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    hiddenItems: [],
    practiceItems: [...DEFAULT_PRACTICE_ITEMS],
    bookmarks: [],
  };
}
Menu Utilities
typescript// File: src/lib/menu/menuUtils.ts

import { NavigationItem } from '@/types/admin/layout';
import { MenuCustomization } from '@/stores/admin/menuCustomization.store';

/**
 * Apply menu customization to navigation items
 */
export function applyMenuCustomization(
  sections: Record<string, NavigationItem[]>,
  customization: MenuCustomization | null
): Record<string, NavigationItem[]> {
  if (!customization) return sections;

  // Filter hidden items
  const filteredSections: Record<string, NavigationItem[]> = {};
  
  Object.entries(sections).forEach(([sectionId, items]) => {
    filteredSections[sectionId] = items.filter(
      item => !customization.hiddenItems.includes(item.href)
    );
  });

  // Reorder sections
  const orderedSections: Record<string, NavigationItem[]> = {};
  customization.sectionOrder.forEach(sectionId => {
    if (filteredSections[sectionId]) {
      orderedSections[sectionId] = filteredSections[sectionId];
    }
  });

  // Add any sections not in custom order (shouldn't happen, but safety)
  Object.entries(filteredSections).forEach(([sectionId, items]) => {
    if (!orderedSections[sectionId]) {
      orderedSections[sectionId] = items;
    }
  });

  return orderedSections;
}

/**
 * Get visible section IDs
 */RetryClaude does not have the ability to run the code it generates yet.AContinuetypescriptexport function getVisibleSections(
  customization: MenuCustomization | null,
  allSections: string[]
): string[] {
  if (!customization) return allSections;
  return customization.sectionOrder.filter(id => allSections.includes(id));
}

/**
 * Check if an item is hidden
 */
export function isItemHidden(
  itemHref: string,
  customization: MenuCustomization | null
): boolean {
  if (!customization) return false;
  return customization.hiddenItems.includes(itemHref);
}

/**
 * Get bookmarked items sorted by order
 */
export function getSortedBookmarks(customization: MenuCustomization | null) {
  if (!customization) return [];
  return [...customization.bookmarks].sort((a, b) => a.order - b.order);
}

/**
 * Get visible practice items sorted by order
 */
export function getVisiblePracticeItems(customization: MenuCustomization | null) {
  if (!customization) return [];
  return customization.practiceItems
    .filter(item => item.visible)
    .sort((a, b) => a.order - b.order);
}

/**
 * Generate unique ID for new bookmark
 */
export function generateBookmarkId(): string {
  return `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique ID for practice item
 */
export function generatePracticeItemId(): string {
  return `practice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
Menu Validator
typescript// File: src/lib/menu/menuValidator.ts

import { MenuCustomization } from '@/stores/admin/menuCustomization.store';
import { DEFAULT_SECTION_ORDER } from './defaultMenu';

/**
 * Validate menu customization structure
 */
export function validateMenuCustomization(
  customization: MenuCustomization
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate section order
  if (!Array.isArray(customization.sectionOrder)) {
    errors.push('sectionOrder must be an array');
  } else {
    // Check if all default sections are present
    const missingSections = DEFAULT_SECTION_ORDER.filter(
      section => !customization.sectionOrder.includes(section)
    );
    if (missingSections.length > 0) {
      errors.push(`Missing sections: ${missingSections.join(', ')}`);
    }
  }

  // Validate hidden items
  if (!Array.isArray(customization.hiddenItems)) {
    errors.push('hiddenItems must be an array');
  }

  // Validate practice items
  if (!Array.isArray(customization.practiceItems)) {
    errors.push('practiceItems must be an array');
  } else {
    customization.practiceItems.forEach((item, index) => {
      if (!item.id || !item.name || !item.href) {
        errors.push(`Practice item at index ${index} is missing required fields`);
      }
    });
  }

  // Validate bookmarks
  if (!Array.isArray(customization.bookmarks)) {
    errors.push('bookmarks must be an array');
  } else {
    customization.bookmarks.forEach((bookmark, index) => {
      if (!bookmark.id || !bookmark.name || !bookmark.href) {
        errors.push(`Bookmark at index ${index} is missing required fields`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize menu customization (remove invalid entries)
 */
export function sanitizeMenuCustomization(
  customization: MenuCustomization
): MenuCustomization {
  return {
    sectionOrder: customization.sectionOrder.filter(
      section => DEFAULT_SECTION_ORDER.includes(section)
    ),
    hiddenItems: Array.isArray(customization.hiddenItems) 
      ? customization.hiddenItems 
      : [],
    practiceItems: customization.practiceItems.filter(
      item => item.id && item.name && item.href
    ),
    bookmarks: customization.bookmarks.filter(
      bookmark => bookmark.id && bookmark.name && bookmark.href
    ),
  };
}

Frontend Components
Main Modal Component
typescript// File: src/components/admin/menu-customization/MenuCustomizationModal.tsx

'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useMenuCustomizationModal } from '@/hooks/admin/useMenuCustomizationModal';
import { MenuCustomizationTabs } from './MenuCustomizationTabs';
import { SectionsTab } from './SectionsTab';
import { YourPracticeTab } from './YourPracticeTab';
import { BookmarksTab } from './BookmarksTab';
import { ResetButton } from './ResetButton';

export function MenuCustomizationModal() {
  const {
    isOpen,
    activeTab,
    tempCustomization,
    closeModal,
    setActiveTab,
    handleSave,
    handleReset,
    updateTempCustomization,
  } = useMenuCustomizationModal();

  if (!isOpen || !tempCustomization) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 transition-opacity"
        onClick={closeModal}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Customise your menu
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <MenuCustomizationTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Tab Content */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {activeTab === 'sections' && (
                <SectionsTab
                  customization={tempCustomization}
                  onUpdate={updateTempCustomization}
                />
              )}
              {activeTab === 'practice' && (
                <YourPracticeTab
                  customization={tempCustomization}
                  onUpdate={updateTempCustomization}
                />
              )}
              {activeTab === 'bookmarks' && (
                <BookmarksTab
                  customization={tempCustomization}
                  onUpdate={updateTempCustomization}
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
              <ResetButton onReset={handleReset} />
              
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
Tab Navigation Component
typescript// File: src/components/admin/menu-customization/MenuCustomizationTabs.tsx

'use client';

import React from 'react';

type TabType = 'sections' | 'practice' | 'bookmarks';

interface MenuCustomizationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function MenuCustomizationTabs({ activeTab, onTabChange }: MenuCustomizationTabsProps) {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'sections', label: 'Sections' },
    { id: 'practice', label: 'Your Practice' },
    { id: 'bookmarks', label: 'Bookmarks' },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="flex -mb-px" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 py-3 px-4 text-center text-sm font-medium border-b-2 transition-colors
              ${
                activeTab === tab.id
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
              focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500
            `}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
Sections Tab Component
typescript// File: src/components/admin/menu-customization/SectionsTab.tsx

'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { MenuCustomization } from '@/stores/admin/menuCustomization.store';
import { DraggableItem } from './DraggableItem';
import { MenuItemCheckbox } from './MenuItemCheckbox';

interface SectionsTabProps {
  customization: MenuCustomization;
  onUpdate: (updates: Partial<MenuCustomization>) => void;
}

const SECTION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  business: 'Business',
  financial: 'Financial',
  operations: 'Operations',
  system: 'System',
};

export function SectionsTab({ customization, onUpdate }: SectionsTabProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = customization.sectionOrder.findIndex((s) => s === active.id);
      const newIndex = customization.sectionOrder.findIndex((s) => s === over.id);
      const reordered = arrayMove(customization.sectionOrder, oldIndex, newIndex);
      onUpdate({ sectionOrder: reordered });
    }
  };

  const handleToggleVisibility = (sectionId: string) => {
    // For now, we don't hide entire sections, just track for future use
    // You can implement section hiding logic here if needed
    console.log('Toggle section:', sectionId);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Choose what you want to see in your menu, and drag and reorder items to fit the way you work:
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={customization.sectionOrder}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {customization.sectionOrder.map((sectionId) => (
              <DraggableItem key={sectionId} id={sectionId}>
                <MenuItemCheckbox
                  checked={true} // Sections are always visible for now
                  onChange={() => handleToggleVisibility(sectionId)}
                  label={SECTION_LABELS[sectionId] || sectionId}
                  disabled={true} // Disable checkbox for sections
                />
              </DraggableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
Your Practice Tab Component
typescript// File: src/components/admin/menu-customization/YourPracticeTab.tsx

'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { MenuCustomization, PracticeItem } from '@/stores/admin/menuCustomization.store';
import { DraggableItem } from './DraggableItem';
import { MenuItemCheckbox } from './MenuItemCheckbox';

interface YourPracticeTabProps {
  customization: MenuCustomization;
  onUpdate: (updates: Partial<MenuCustomization>) => void;
}

export function YourPracticeTab({ customization, onUpdate }: YourPracticeTabProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedItems = [...customization.practiceItems].sort((a, b) => a.order - b.order);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedItems.findIndex((item) => item.id === active.id);
      const newIndex = sortedItems.findIndex((item) => item.id === over.id);
      const reordered = arrayMove(sortedItems, oldIndex, newIndex);
      
      // Update order property
      const updated = reordered.map((item, index) => ({
        ...item,
        order: index,
      }));
      
      onUpdate({ practiceItems: updated });
    }
  };

  const handleToggleVisibility = (itemId: string) => {
    const updated = customization.practiceItems.map((item) =>
      item.id === itemId ? { ...item, visible: !item.visible } : item
    );
    onUpdate({ practiceItems: updated });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Choose what you want to see in your menu, and drag and reorder items to fit the way you work:
      </p>

      <button
        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        onClick={() => {
          // Reset to default
          onUpdate({ 
            practiceItems: customization.practiceItems.map((item, index) => ({
              ...item,
              order: index,
              visible: true,
            }))
          });
        }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset to default menu
      </button>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedItems.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sortedItems.map((item) => (
              <DraggableItem key={item.id} id={item.id}>
                <MenuItemCheckbox
                  checked={item.visible}
                  onChange={() => handleToggleVisibility(item.id)}
                  label={item.name}
                />
              </DraggableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
Bookmarks Tab Component
typescript// File: src/components/admin/menu-customization/BookmarksTab.tsx

'use client';

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Search, X } from 'lucide-react';
import { MenuCustomization, Bookmark } from '@/stores/admin/menuCustomization.store';
import { DraggableItem } from './DraggableItem';
import { generateBookmarkId } from '@/lib/menu/menuUtils';

interface BookmarksTabProps {
  customization: MenuCustomization;
  onUpdate: (updates: Partial<MenuCustomization>) => void;
}

// Available pages to bookmark
const AVAILABLE_PAGES = [
  { name: 'Management reports', href: '/admin/reports/management', icon: 'FileText' },
  { name: 'Products & services', href: '/admin/products-services', icon: 'Package' },
  { name: 'Reconcile', href: '/admin/reconcile', icon: 'FileCheck' },
  { name: 'Tax Settings', href: '/admin/taxes/settings', icon: 'Settings' },
  { name: 'Invoice Templates', href: '/admin/invoices/templates', icon: 'FileText' },
  { name: 'Team Management', href: '/admin/team', icon: 'Users' },
  { name: 'Service Analytics', href: '/admin/services/analytics', icon: 'BarChart' },
];

export function BookmarksTab({ customization, onUpdate }: BookmarksTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedBookmarks = useMemo(() => {
    return [...customization.bookmarks].sort((a, b) => a.order - b.order);
  }, [customization.bookmarks]);

  const availablePages = useMemo(() => {
    return AVAILABLE_PAGES.filter(page => 
      !customization.bookmarks.some(b => b.href === page.href) &&
      page.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customization.bookmarks, searchQuery]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedBookmarks.findIndex((b) => b.id === active.id);
      const newIndex = sortedBookmarks.findIndex((b) => b.id === over.id);
      const reordered = arrayMove(sortedBookmarks, oldIndex, newIndex);
      
      // Update order property
      const updated = reordered.map((bookmark, index) => ({
        ...bookmark,
        order: index,
      }));
      
      onUpdate({ bookmarks: updated });
    }
  };

  const handleAddBookmark = (page: typeof AVAILABLE_PAGES[0]) => {
    const newBookmark: Bookmark = {
      id: generateBookmarkId(),
      name: page.name,
      href: page.href,
      icon: page.icon,
      order: customization.bookmarks.length,
    };
    
    onUpdate({ bookmarks: [...customization.bookmarks, newBookmark] });
  };

  const handleRemoveBookmark = (bookmarkId: string) => {
    const updated = customization.bookmarks
      .filter(b => b.id !== bookmarkId)
      .map((bookmark, index) => ({ ...bookmark, order: index }));
    
    onUpdate({ bookmarks: updated });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Select pages to bookmark, and drag and reorder them to fit the way you work:
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search pages to bookmark"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Available pages to add */}
      {searchQuery && availablePages.length > 0 && (
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
          {availablePages.map((page) => (
            <button
              key={page.href}
              onClick={() => handleAddBookmark(page)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
            >
              <span>{page.name}</span>
              <span className="text-blue-600 text-xs">+ Add</span>
            </button>
          ))}
        </div>
      )}

      {/* Current bookmarks */}
      {sortedBookmarks.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedBookmarks.map(b => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sortedBookmarks.map((bookmark) => (
                <DraggableItem key={bookmark.id} id={bookmark.id}>
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-sm text-gray-900">{bookmark.name}</span>
                    <button
                      onClick={() => handleRemoveBookmark(bookmark.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      aria-label={`Remove ${bookmark.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </DraggableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-8 text-gray-500 text-sm">
          No bookmarks yet. Search and add pages above.
        </div>
      )}
    </div>
  );
}
Reusable Components
typescript// File: src/components/admin/menu-customization/MenuItemCheckbox.tsx

'use client';

import React from 'react';

interface MenuItemCheckboxProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}

export function MenuItemCheckbox({ checked, onChange, label, disabled }: MenuItemCheckboxProps) {
  return (
    <label className="flex items-center gap-3 flex-1 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
        {label}
      </span>
    </label>
  );
}
typescript// File: src/components/admin/menu-customization/ResetButton.tsx

'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ResetButtonProps {
  onReset: () => void;
}

export function ResetButton({ onReset }: ResetButtonProps) {
  return (
    <button
      onClick={onReset}
      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
    >
      <RotateCcw className="w-4 h-4" />
      Reset to default menu
    </button>
  );
}

Integration with Existing Sidebar
Updated AdminSidebar Component
typescript// File: src/components/admin/layout/AdminSidebar.tsx (modifications)

'use client';

import { useEffect, useMemo } from 'react';
import { useMenuCustomization } from '@/stores/admin/menuCustomization.store';
import { applyMenuCustomization, getSortedBookmarks } from '@/lib/menu/menuUtils';
// ... other imports

export function AdminSidebar(props: AdminSidebarProps) {
  // ... existing code
  
  const menuCustomization = useMenuCustomization();
  
  // Apply customization to navigation
  const customizedNavigation = useMemo(() => {
    return applyMenuCustomization(navigation, menuCustomization);
  }, [navigation, menuCustomization]);
  
  // Get bookmarks
  const bookmarks = useMemo(() => {
    return getSortedBookmarks(menuCustomization);
  }, [menuCustomization]);

  return (
    <div className={/* ... */}>
      {/* Header */}
      <SidebarHeader collapsed={isCollapsed} />

      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
        {/* Bookmarks section (if any) */}
        {bookmarks.length > 0 && (
          <div className="mb-4">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Bookmarks
            </h3>
            <ul className="space-y-1">
              {bookmarks.map((bookmark) => (
                <li key={bookmark.id}>
                  <Link
                    href={bookmark.href}
                    className={/* ... */}
                  >
                    {/* Render bookmark */}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Regular navigation with customization applied */}
        {Object.entries(customizedNavigation).map(([sectionId, items]) => (
          <div key={sectionId}>
            {/* Render section and items */}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <SidebarFooter collapsed={isCollapsed} isMobile={isMobile} onClose={onClose} />
    </div>
  );
}
Add Customization Button to Sidebar Header
typescript// File: src/components/admin/layout/SidebarHeader.tsx (modifications)

'use client';

import { Settings2 } from 'lucide-react';
import { useMenuCustomizationModal } from '@/hooks/admin/useMenuCustomizationModal';

export function SidebarHeader({ collapsed }: SidebarHeaderProps) {
  const { openModal } = useMenuCustomizationModal();

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b">
      {/* ... existing branding code */}
      
      {!collapsed && (
        <button
          onClick={openModal}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
          title="Customize menu"
          aria-label="Customize menu"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
Load Customization on App Init
typescript// File: src/components/admin/layout/AdminDashboardLayout.tsx (modifications)

'use client';

import { useEffect } from 'react';
import { useMenuCustomizationActions } from '@/stores/admin/menuCustomization.store';
import { MenuCustomizationModal } from '../menu-customization/MenuCustomizationModal';

export function AdminDashboardLayout({ children, session }: AdminDashboardLayoutProps) {
  const { load } = useMenuCustomizationActions();

  // Load menu customization on mount
  useEffect(() => {
    if (session?.user?.id) {
      load().catch(err => {
        console.error('Failed to load menu customization:', err);
      });
    }
  }, [session?.user?.id, load]);

  return (
    <>
      {/* ... existing layout code */}
      
      {/* Add modal */}
      <MenuCustomizationModal />
    </>
  );
}

Testing Strategy
Unit Tests
typescript// File: src/lib/menu/__tests__/menuUtils.test.ts

import { describe, it, expect } from '@jest/globals';
import { applyMenuCustomization, isItemHidden } from '../menuUtils';

describe('menuUtils', () => {
  describe('applyMenuCustomization', () => {
    it('should return original sections when no customization', () => {
      const sections = {
        dashboard: [{ name: 'Overview', href: '/admin' }],
      };
      
      const result = applyMenuCustomizationRetryClaude does not have the ability to run the code it generates yet.AContinuetypescript(sections, null);
      
      expect(result).toEqual(sections);
    });

    it('should filter hidden items', () => {
      const sections = {
        dashboard: [
          { name: 'Overview', href: '/admin' },
          { name: 'Analytics', href: '/admin/analytics' },
        ],
      };
      
      const customization = {
        sectionOrder: ['dashboard'],
        hiddenItems: ['/admin/analytics'],
        practiceItems: [],
        bookmarks: [],
      };
      
      const result = applyMenuCustomization(sections, customization);
      
      expect(result.dashboard).toHaveLength(1);
      expect(result.dashboard[0].href).toBe('/admin');
    });

    it('should reorder sections', () => {
      const sections = {
        dashboard: [{ name: 'Overview', href: '/admin' }],
        business: [{ name: 'Clients', href: '/admin/clients' }],
        financial: [{ name: 'Invoices', href: '/admin/invoices' }],
      };
      
      const customization = {
        sectionOrder: ['financial', 'dashboard', 'business'],
        hiddenItems: [],
        practiceItems: [],
        bookmarks: [],
      };
      
      const result = applyMenuCustomization(sections, customization);
      const keys = Object.keys(result);
      
      expect(keys).toEqual(['financial', 'dashboard', 'business']);
    });
  });

  describe('isItemHidden', () => {
    it('should return false when no customization', () => {
      expect(isItemHidden('/admin/test', null)).toBe(false);
    });

    it('should return true when item is hidden', () => {
      const customization = {
        sectionOrder: [],
        hiddenItems: ['/admin/test'],
        practiceItems: [],
        bookmarks: [],
      };
      
      expect(isItemHidden('/admin/test', customization)).toBe(true);
    });

    it('should return false when item is not hidden', () => {
      const customization = {
        sectionOrder: [],
        hiddenItems: ['/admin/other'],
        practiceItems: [],
        bookmarks: [],
      };
      
      expect(isItemHidden('/admin/test', customization)).toBe(false);
    });
  });
});
typescript// File: src/lib/menu/__tests__/menuValidator.test.ts

import { describe, it, expect } from '@jest/globals';
import { validateMenuCustomization, sanitizeMenuCustomization } from '../menuValidator';

describe('menuValidator', () => {
  describe('validateMenuCustomization', () => {
    it('should validate correct customization', () => {
      const customization = {
        sectionOrder: ['dashboard', 'business', 'financial', 'operations', 'system'],
        hiddenItems: [],
        practiceItems: [],
        bookmarks: [],
      };
      
      const result = validateMenuCustomization(customization);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing sections', () => {
      const customization = {
        sectionOrder: ['dashboard'],
        hiddenItems: [],
        practiceItems: [],
        bookmarks: [],
      };
      
      const result = validateMenuCustomization(customization);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid practice items', () => {
      const customization = {
        sectionOrder: ['dashboard', 'business', 'financial', 'operations', 'system'],
        hiddenItems: [],
        practiceItems: [{ id: '', name: '', href: '' }],
        bookmarks: [],
      };
      
      const result = validateMenuCustomization(customization);
      
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeMenuCustomization', () => {
    it('should remove invalid sections', () => {
      const customization = {
        sectionOrder: ['dashboard', 'invalid', 'business'],
        hiddenItems: [],
        practiceItems: [],
        bookmarks: [],
      };
      
      const result = sanitizeMenuCustomization(customization);
      
      expect(result.sectionOrder).not.toContain('invalid');
      expect(result.sectionOrder).toContain('dashboard');
      expect(result.sectionOrder).toContain('business');
    });

    it('should remove invalid bookmarks', () => {
      const customization = {
        sectionOrder: ['dashboard', 'business', 'financial', 'operations', 'system'],
        hiddenItems: [],
        practiceItems: [],
        bookmarks: [
          { id: '', name: 'Invalid', href: '', icon: '', order: 0 },
          { id: '1', name: 'Valid', href: '/test', icon: 'Icon', order: 1 },
        ],
      };
      
      const result = sanitizeMenuCustomization(customization);
      
      expect(result.bookmarks).toHaveLength(1);
      expect(result.bookmarks[0].name).toBe('Valid');
    });
  });
});
Integration Tests
typescript// File: src/components/admin/menu-customization/__tests__/MenuCustomizationModal.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MenuCustomizationModal } from '../MenuCustomizationModal';
import { useMenuCustomizationModal } from '@/hooks/admin/useMenuCustomizationModal';

jest.mock('@/hooks/admin/useMenuCustomizationModal');

describe('MenuCustomizationModal', () => {
  const mockOpenModal = jest.fn();
  const mockCloseModal = jest.fn();
  const mockHandleSave = jest.fn();
  const mockHandleReset = jest.fn();

  beforeEach(() => {
    (useMenuCustomizationModal as jest.Mock).mockReturnValue({
      isOpen: true,
      activeTab: 'sections',
      tempCustomization: {
        sectionOrder: ['dashboard', 'business'],
        hiddenItems: [],
        practiceItems: [],
        bookmarks: [],
      },
      openModal: mockOpenModal,
      closeModal: mockCloseModal,
      setActiveTab: jest.fn(),
      handleSave: mockHandleSave,
      handleReset: mockHandleReset,
      updateTempCustomization: jest.fn(),
    });
  });

  it('should render modal when open', () => {
    render(<MenuCustomizationModal />);
    
    expect(screen.getByText('Customise your menu')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    (useMenuCustomizationModal as jest.Mock).mockReturnValue({
      isOpen: false,
      tempCustomization: null,
    });
    
    const { container } = render(<MenuCustomizationModal />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should call closeModal when clicking backdrop', () => {
    render(<MenuCustomizationModal />);
    
    const backdrop = screen.getByRole('presentation', { hidden: true });
    fireEvent.click(backdrop);
    
    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('should call handleSave when clicking Save button', async () => {
    render(<MenuCustomizationModal />);
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockHandleSave).toHaveBeenCalled();
    });
  });

  it('should call closeModal when clicking Cancel button', () => {
    render(<MenuCustomizationModal />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('should switch tabs correctly', () => {
    const mockSetActiveTab = jest.fn();
    
    (useMenuCustomizationModal as jest.Mock).mockReturnValue({
      isOpen: true,
      activeTab: 'sections',
      tempCustomization: {
        sectionOrder: [],
        hiddenItems: [],
        practiceItems: [],
        bookmarks: [],
      },
      setActiveTab: mockSetActiveTab,
      closeModal: mockCloseModal,
      handleSave: mockHandleSave,
      handleReset: mockHandleReset,
      updateTempCustomization: jest.fn(),
    });
    
    render(<MenuCustomizationModal />);
    
    const practiceTab = screen.getByText('Your Practice');
    fireEvent.click(practiceTab);
    
    expect(mockSetActiveTab).toHaveBeenCalledWith('practice');
  });
});
E2E Tests
typescript// File: cypress/e2e/admin/menu-customization.cy.ts

describe('Menu Customization', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'password');
    cy.visit('/admin');
  });

  it('should open customization modal', () => {
    cy.get('[aria-label="Customize menu"]').click();
    cy.contains('Customise your menu').should('be.visible');
  });

  it('should reorder sections via drag and drop', () => {
    cy.get('[aria-label="Customize menu"]').click();
    
    // Get initial order
    cy.get('[data-testid="section-item"]').first().should('contain', 'Dashboard');
    
    // Drag Business section to top
    cy.get('[data-testid="section-item"]')
      .contains('Business')
      .parent()
      .drag('[data-testid="section-item"]:first');
    
    // Verify order changed
    cy.get('[data-testid="section-item"]').first().should('contain', 'Business');
    
    // Save changes
    cy.contains('button', 'Save').click();
    
    // Verify sidebar reflects changes
    cy.get('nav [data-section="business"]').should('be.visible');
  });

  it('should hide/show menu items', () => {
    cy.get('[aria-label="Customize menu"]').click();
    
    // Switch to Your Practice tab
    cy.contains('button', 'Your Practice').click();
    
    // Uncheck a practice item
    cy.get('[data-testid="practice-item"]')
      .contains('Training')
      .parent()
      .find('input[type="checkbox"]')
      .uncheck();
    
    // Save changes
    cy.contains('button', 'Save').click();
    
    // Verify item is hidden in sidebar
    cy.contains('Training').should('not.exist');
  });

  it('should add and remove bookmarks', () => {
    cy.get('[aria-label="Customize menu"]').click();
    
    // Switch to Bookmarks tab
    cy.contains('button', 'Bookmarks').click();
    
    // Search for a page
    cy.get('input[placeholder*="Search pages"]').type('Products');
    
    // Add bookmark
    cy.contains('Products & services').parent().contains('Add').click();
    
    // Verify bookmark appears in list
    cy.get('[data-testid="bookmark-item"]').should('contain', 'Products & services');
    
    // Remove bookmark
    cy.get('[data-testid="bookmark-item"]')
      .contains('Products & services')
      .parent()
      .find('[aria-label*="Remove"]')
      .click();
    
    // Verify bookmark removed
    cy.get('[data-testid="bookmark-item"]').should('not.contain', 'Products & services');
  });

  it('should reset to defaults', () => {
    cy.get('[aria-label="Customize menu"]').click();
    
    // Make some changes
    cy.contains('button', 'Your Practice').click();
    cy.get('[data-testid="practice-item"]')
      .first()
      .find('input[type="checkbox"]')
      .uncheck();
    
    // Click reset button
    cy.contains('Reset to default menu').click();
    
    // Confirm dialog
    cy.on('window:confirm', () => true);
    
    // Verify modal closed
    cy.contains('Customise your menu').should('not.exist');
    
    // Verify sidebar shows default items
    cy.contains('Training').should('be.visible');
  });

  it('should persist customization across sessions', () => {
    // Customize menu
    cy.get('[aria-label="Customize menu"]').click();
    cy.contains('button', 'Bookmarks').click();
    cy.get('input[placeholder*="Search pages"]').type('Reconcile');
    cy.contains('Reconcile').parent().contains('Add').click();
    cy.contains('button', 'Save').click();
    
    // Verify bookmark in sidebar
    cy.contains('Reconcile').should('be.visible');
    
    // Logout and login again
    cy.logout();
    cy.login('admin@example.com', 'password');
    cy.visit('/admin');
    
    // Verify bookmark still exists
    cy.contains('Reconcile').should('be.visible');
  });
});

Migration Plan
Phase 1: Database Setup (Week 1, Days 1-2)

Create Prisma Schema

Add MenuCustomization model
Update User model with relation
Run migration: npx prisma migrate dev --name add_menu_customization


Seed Default Data (optional)

typescript   // File: prisma/seed.ts
   
   async function seedMenuCustomizations() {
     const users = await prisma.user.findMany();
     
     for (const user of users) {
       await prisma.menuCustomization.create({
         data: {
           userId: user.id,
           sectionOrder: DEFAULT_SECTION_ORDER,
           hiddenItems: [],
           practiceItems: DEFAULT_PRACTICE_ITEMS,
           bookmarks: [],
         },
       });
     }
   }
Phase 2: Backend Implementation (Week 1, Days 3-4)

Create API Routes

Implement GET endpoint
Implement POST endpoint
Implement DELETE endpoint
Add validation with Zod
Add error handling


Create Utility Functions

defaultMenu.ts
menuUtils.ts
menuValidator.ts


Write Backend Tests

Unit tests for utilities
Integration tests for API routes



Phase 3: State Management (Week 1, Day 5)

Create Zustand Store

Define state interface
Implement actions
Add persistence middleware


Create Custom Hooks

useMenuCustomizationModal.ts
Selector hooks



Phase 4: UI Components (Week 2, Days 1-3)

Install Dependencies

bash   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

Create Base Components

DraggableItem.tsx
MenuItemCheckbox.tsx
ResetButton.tsx
SearchFilter.tsx (if needed)


Create Tab Components

MenuCustomizationTabs.tsx
SectionsTab.tsx
YourPracticeTab.tsx
BookmarksTab.tsx


Create Main Modal

MenuCustomizationModal.tsx


Style Components

Match QuickBooks design
Ensure accessibility
Test responsive behavior



Phase 5: Integration (Week 2, Day 4)

Update AdminSidebar

Import customization store
Apply customization to navigation
Render bookmarks section


Update SidebarHeader

Add customization button
Wire up modal trigger


Update AdminDashboardLayout

Load customization on mount
Render modal component



Phase 6: Testing (Week 2, Day 5)

Write Unit Tests

Component tests
Store tests
Utility tests


Write Integration Tests

Modal interactions
API integration
State updates


Write E2E Tests

Full user workflows
Cross-browser testing
Persistence testing



Phase 7: QA & Deployment (Week 3)

Manual Testing

Test all drag-drop scenarios
Test with different user roles
Test error states
Test edge cases


Performance Testing

Measure load times
Test with large datasets
Optimize if needed


Documentation

Update user guide
Add inline comments
Create troubleshooting guide


Deployment

Deploy to staging
Run smoke tests
Deploy to production
Monitor for issues




Performance Considerations
Optimization Strategies

Lazy Loading

typescript   // Lazy load modal to reduce initial bundle size
   const MenuCustomizationModal = dynamic(
     () => import('./MenuCustomizationModal'),
     { ssr: false }
   );

Memoization

typescript   // Memoize expensive computations
   const customizedNav = useMemo(() => {
     return applyMenuCustomization(navigation, customization);
   }, [navigation, customization]);

Debounced Search

typescript   // Debounce search input
   const debouncedSearch = useMemo(
     () => debounce((query: string) => {
       setSearchQuery(query);
     }, 300),
     []
   );

Virtual Lists (for large bookmark lists)

typescript   // Use react-window for large lists
   import { FixedSizeList } from 'react-window';
   
   <FixedSizeList
     height={400}
     itemCount={bookmarks.length}
     itemSize={50}
   >
     {({ index, style }) => (
       <div style={style}>
         {/* Render bookmark */}
       </div>
     )}
   </FixedSizeList>
Performance Metrics
MetricTargetMeasurementInitial Load< 500msTime to interactiveModal Open< 100msAnimation startDrag Operation60 FPSFrame rate during dragSave Operation< 1sAPI response timeSidebar Update< 50msRe-render after save

Accessibility Requirements
WCAG 2.1 AA Compliance

Keyboard Navigation

Tab through all interactive elements
Arrow keys for drag-drop alternative
Enter/Space to activate
Escape to close modal


Screen Reader Support

Proper ARIA labels on all controls
Announce drag-drop state changes
Announce save/error messages
Logical reading order


Focus Management

Focus trap within modal
Return focus to trigger on close
Visible focus indicators
Skip links where appropriate


Color Contrast

Text: 4.5:1 minimum
UI components: 3:1 minimum
Don't rely on color alone


Touch Targets

Minimum 44x44px touch targets
Adequate spacing between targets



Accessibility Implementation
typescript// File: src/components/admin/menu-customization/MenuCustomizationModal.tsx (accessibility features)

import { useEffect, useRef } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export function MenuCustomizationModal() {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  // Trap focus within modal
  useFocusTrap(modalRef, isOpen);
  
  // Save and restore focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus first interactive element
      modalRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);
  
  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeModal]);
  
  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <h2 id="modal-title" className="sr-only">
        Customise your menu
      </h2>
      <p id="modal-description" className="sr-only">
        Reorder sections, hide items, and manage bookmarks to customize your admin menu
      </p>
      
      {/* Modal content */}
    </div>
  );
}

Security Considerations
Security Measures

Authentication

Verify user session on all API routes
User can only modify their own customization
Admin cannot modify other users' customizations


Input Validation

Validate all input with Zod schemas
Sanitize user input
Check array lengths
Validate URLs in bookmarks


SQL Injection Prevention

Use Prisma ORM (parameterized queries)
Never concatenate user input into queries


XSS Prevention

React automatically escapes content
Sanitize href attributes
Use rel="noopener noreferrer" on external links


CSRF Protection

Use Next.js built-in CSRF tokens
Verify tokens on state-changing operations


Rate Limiting

typescript   // File: src/app/api/admin/menu-customization/route.ts
   
   import { rateLimit } from '@/lib/rate-limit';
   
   const limiter = rateLimit({
     interval: 60 * 1000, // 1 minute
     uniqueTokenPerInterval: 500,
   });
   
   export async function POST(request: NextRequest) {
     try {
       await limiter.check(request, 10, 'CACHE_TOKEN'); // 10 requests per minute
       // ... rest of handler
     } catch {
       return NextResponse.json(
         { error: 'Rate limit exceeded' },
         { status: 429 }
       );
     }
   }
Security Checklist

 All API routes check authentication
 User can only access their own data
 Input validation on all endpoints
 Sanitize URLs in bookmarks
 Rate limiting on write operations
 Audit logging for customization changes
 Regular security dependency updates
 Content Security Policy headers configured


Troubleshooting Guide
Common Issues
Issue: Modal doesn't open
Symptoms: Clicking customize button does nothing
Causes:

Store not initialized
Hook not properly connected
JavaScript error preventing execution

Solutions:
typescript// Check browser console for errors
// Verify store connection
const { openModal } = useMenuCustomizationModal();
console.log('openModal function:', openModal);

// Verify store state
const store = useMenuCustomizationStore.getState();
console.log('Store state:', store);
Issue: Drag-drop not working
Symptoms: Items can't be dragged
Causes:

@dnd-kit not properly installed
Sensors not configured
Touch events not handled

Solutions:
bash# Reinstall dependencies
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Check sensor configuration
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor)
);
Issue: Changes not persisting
Symptoms: Customization resets on page reload
Causes:

API request failing
Database connection issue
Store persistence not configured

Solutions:
typescript// Check API response
const response = await fetch('/api/admin/menu-customization');
console.log('API status:', response.status);
console.log('API data:', await response.json());

// Check localStorage
const stored = localStorage.getItem('menu-customization-storage');
console.log('Stored data:', stored);
Issue: Bookmarks not showing
Symptoms: Bookmarks saved but not visible
Causes:

Sidebar not applying customization
Render logic issue
Customization not loaded

Solutions:
typescript// Check customization in sidebar
const customization = useMenuCustomization();
console.log('Loaded customization:', customization);
console.log('Bookmarks:', customization?.bookmarks);

Deployment Checklist
Pre-Deployment

 All tests passing (unit, integration, E2E)
 Code review completed
 Database migration tested on staging
 Performance benchmarks met
 Accessibility audit passed
 Security review completed
 Documentation updated
 Changelog updated

Deployment Steps

Database Migration

bash   # On staging
   npx prisma migrate deploy
   
   # On production
   npx prisma migrate deploy

Environment Variables

No new variables needed
Verify existing database connection


Build and Deploy

bash   npm run build
   npm run deploy

Post-Deployment Verification

 API endpoints responding
 Modal opens correctly
 Drag-drop working
 Changes persist
 No console errors
 Performance acceptable



Rollback Plan
If issues occur:

Database Rollback

bash   # Revert migration
   npx prisma migrate reset

Code Rollback

Revert to previous Git commit
Redeploy previous version


Data Preservation

MenuCustomization table can remain
Old sidebar will ignore customizations
No data loss




Future Enhancements
Phase 2 Features (Future)

Themes & Appearance

Custom sidebar colors
Icon style options
Compact/comfortable density


Advanced Bookmarks

Bookmark folders/groups
Quick access shortcuts (Ctrl+1, etc.)
Recently visited pages


Smart Suggestions

AI-recommended menu layouts
Usage-based auto-reordering
Popular configurations


Export/Import

Export customization as JSON
Share configurations with team
Import from file


Multi-Device Sync

Cloud sync across devices
Device-specific customizations
Merge conflict resolution


Analytics Dashboard

Most used menu items
Time spent in sections
Efficiency metrics




Conclusion
This implementation guide provides a comprehensive roadmap for building a QuickBooks-style menu customization modal in the NextAccounting admin dashboard. The feature is designed to be:

User-Friendly: Intuitive drag-and-drop interface
Flexible: Multiple customization options
Persistent: Saves preferences per user
Accessible: WCAG 2.1 AA compliant
Performant: Optimized for speed
Secure: Protected against common vulnerabilities
Maintainable: Well-structured and documented

By following this guide, you'll deliver a professional, production-ready feature that significantly enhances user experience and workflow efficiency.

Document Status: ✅ Complete and Ready for Implementation
Last Updated: October 19, 2025
