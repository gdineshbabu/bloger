/* eslint-disable @typescript-eslint/no-explicit-any */
import { PageContent, PageStyles, SiteData } from "./editor";


export const generateContentWithGemini = async (prompt: string): Promise<string> => {
    try {
        const response = await fetch('/api/generate-layout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });
        if (!response.ok) throw new Error('Failed to generate content');
        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error("Client-side Gemini Error:", error);
        return "Error: Could not generate content.";
    }
};

export const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem("blogToken");
};

export const apiClient = {
  fetchSite: async (siteId: string): Promise<SiteData> => {
      if (typeof window === 'undefined') {
          return Promise.reject(new Error('Cannot fetch on server'));
      }
      const token = getAuthToken();
      if (!token) throw new Error('Authentication token not found');
      const response = await fetch(`/api/sites/${siteId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
          throw new Error('Failed to fetch site data');
      }
      return response.json();
  },
  saveSiteDraft: async (siteId: string, data: { content: PageContent, pageStyles: PageStyles }): Promise<{ success: boolean }> => {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication token not found');
      const response = await fetch(`/api/sites/${siteId}`, {
          method: 'PUT',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
      });
      if (!response.ok) {
          throw new Error('Failed to save site draft');
      }
      return { success: true };
  },
  getHistory: async (siteId: string): Promise<{ history: any[] }> => {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication token not found');
      const response = await fetch(`/api/sites/${siteId}/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch history');
      return response.json();
  },
  saveVersion: async (siteId: string, data: { content: PageContent, pageStyles: PageStyles, versionName: string }): Promise<{ success: boolean }> => {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication token not found');

      const payload = {
          content: data.content,
          pageStyles: data.pageStyles,
          versionName: data.versionName,
      };
      
      const response = await fetch(`/api/sites/${siteId}/history`, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to save version');
      return { success: true };
  },
};

export const lucideIconOptions = [
  'Award', 'CheckCircle', 'Shield', 'Zap', 'Rocket', 'Database', 'Cloud', 'Lock', 'Settings', 'Code',
  'Star', 'Heart', 'Users', 'Globe', 'Mail', 'MessageSquare', 'Calendar', 'Clock', 'Server', 'Layers',
  'TrendingUp', 'CreditCard', 'FileText', 'Image', 'Video', 'Monitor', 'Phone', 'MapPin', 'ThumbsUp', 'Package'
].sort().map(name => ({ label: name, value: name }));

export const getScreenSizeClass = (screenSize: 'desktop' | 'tablet' | 'mobile') => {
  switch (screenSize) {
    case 'tablet': return 'w-[768px]';
    case 'mobile': return 'w-[420px]';
    default: return 'w-full';
  }
};