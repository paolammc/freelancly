"use client";

import { useEffect, useState } from "react";
import { QuickTaskModal } from "./quick-task-modal";

interface Project {
  id: string;
  title: string;
}

export function QuickTaskProvider() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoaded(true);
      }
    }

    fetchProjects();
  }, []);

  if (!isLoaded || projects.length === 0) {
    return null;
  }

  return <QuickTaskModal projects={projects} />;
}
