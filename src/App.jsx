import React, { useState, useEffect, useRef, createContext, useContext, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, Users, Upload, Settings, LogOut, Menu, X, Search,
  TrendingUp, TrendingDown, ChevronRight, ChevronLeft, Bell, Filter, Download,
  Plus, Edit2, Trash2, Eye, Phone, Mail, Calendar, CalendarDays, Clock,
  Target, Zap, Brain, BarChart3, Activity, RefreshCw,
  Building2, User, CheckCircle2, AlertCircle, MoreHorizontal,
  MessageSquare, Send, Bot, Lightbulb, Lock,
  FileText, FileJson, Check, ChevronDown, ArrowRight,
  Flame, Snowflake, Sparkles, ExternalLink, TrendingUp as TrendUp,
  Globe, DollarSign, Briefcase, Award, Linkedin, Shield, Video, MapPin
} from 'lucide-react';

import { ErrorBoundary } from './components/ErrorBoundary';
import { integrationConfig, INTEGRATIONS, generateEnvTemplate } from './services/integrationConfig';
import { integrationService } from './services/integrationClients';

// DESIGN TOKENS
const tokens = {
  colors: {
    gray: {
      950: '#020409',  // Blue Black
      900: '#0B1828',  // Dark Blue (primary background)
      850: '#0f1d2f',  // Slightly lighter
      800: '#152238',  // Card backgrounds
      700: '#1c2d45',  // Borders, dividers
      600: '#2a3f5f',  // Muted elements
      500: '#3d5478',  // Secondary text
      400: '#5a7194',  // Placeholder text
      300: '#8ba3c7',  // Secondary content
      200: '#b8cce6',  // Light accents
      100: '#dce8f5',  // Very light
      50: '#f0f5fa',   // Near white
    },
    primary: {
      DEFAULT: '#3148B9',  // Space Blue
      50: 'rgba(49, 72, 185, 0.06)',
      100: 'rgba(49, 72, 185, 0.12)',
      200: 'rgba(49, 72, 185, 0.24)',
      hover: '#2a3fa6',
      active: '#233693',
      light: '#4a5fd4',
    },
    accent: {
      DEFAULT: '#F24C03',  // Brand Orange
      muted: 'rgba(242, 76, 3, 0.12)',
      light: '#ff6b2c',
      dark: '#d94200',
    },
    // Semantic
    success: { DEFAULT: '#10b981', muted: 'rgba(16, 185, 129, 0.12)' },
    warning: { DEFAULT: '#F24C03', muted: 'rgba(242, 76, 3, 0.12)' },  // Use brand orange
    error: { DEFAULT: '#ef4444', muted: 'rgba(239, 68, 68, 0.12)' },
    // Status-specific
    hot: { bg: 'rgba(242, 76, 3, 0.1)', text: '#F24C03', border: 'rgba(242, 76, 3, 0.3)' },  // Orange for hot
    warm: { bg: 'rgba(251, 191, 36, 0.08)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.2)' },
    cold: { bg: 'rgba(49, 72, 185, 0.1)', text: '#6b8cdc', border: 'rgba(49, 72, 185, 0.3)' },  // Space Blue for cold
    new: { bg: 'rgba(16, 185, 129, 0.08)', text: '#34d399', border: 'rgba(16, 185, 129, 0.2)' },
  },
  // Brand gradients
  gradients: {
    brand: 'linear-gradient(135deg, #3148B9 0%, #F24C03 100%)',
    brandSubtle: 'linear-gradient(135deg, rgba(49, 72, 185, 0.2) 0%, rgba(242, 76, 3, 0.1) 100%)',
    blueDark: 'linear-gradient(180deg, #0B1828 0%, #020409 100%)',
    blueRadial: 'radial-gradient(ellipse at top right, rgba(49, 72, 185, 0.15) 0%, transparent 50%)',
    orangeGlow: 'radial-gradient(ellipse at bottom left, rgba(242, 76, 3, 0.1) 0%, transparent 50%)',
    card: 'linear-gradient(135deg, rgba(49, 72, 185, 0.05) 0%, rgba(21, 34, 56, 0.5) 100%)',
  },
  spacing: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 },
  radius: { sm: 6, md: 8, lg: 12, xl: 16, '2xl': 20, full: 9999 },
  shadow: {
    sm: '0 1px 2px rgba(2, 4, 9, 0.4)',
    md: '0 4px 12px rgba(2, 4, 9, 0.35)',
    lg: '0 8px 24px rgba(2, 4, 9, 0.4)',
    glow: '0 0 24px rgba(49, 72, 185, 0.2)',
    glowOrange: '0 0 24px rgba(242, 76, 3, 0.15)',
    card: '0 4px 20px rgba(2, 4, 9, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
  },
  transition: { fast: '120ms ease', base: '200ms ease', slow: '300ms ease-out' },
  font: {
    heading: '"Raleway", -apple-system, BlinkMacSystemFont, sans-serif',
    body: '"Montserrat", -apple-system, BlinkMacSystemFont, sans-serif',
    sans: '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", Consolas, monospace',
  },
};

// Shorthand
const c = tokens.colors;
const sp = tokens.spacing;
const r = tokens.radius;

// CONFIG & MOCK DATA
const CONFIG = { appName: 'LeadGen Pro', company: 'Bluestarai', version: '1.0.0' };

const MOCK_USERS = {
  admin: { id: 'admin-1', email: 'admin@bluestarai.world', password: 'admin123', role: 'admin', name: 'Victor Oluwagbemiga' },
  clients: [
    { id: 'client-1', email: 'chris@azimont.com', password: 'client123', role: 'client', name: 'Chris Garcia', company: 'The Azimont Group' },
    { id: 'client-2', email: 'john@soona.com', password: 'client123', role: 'client', name: 'John Mitchell', company: 'Soona Realty' },
    { id: 'client-3', email: 'sarah@libertas.com', password: 'client123', role: 'client', name: 'Sarah Chen', company: 'Libertas Funding' },
  ]
};

const generateMockLeads = (clientId) => {
  const names = ['James Wilson', 'Emma Thompson', 'Michael Brown', 'Olivia Davis', 'William Taylor', 'Sophia Anderson', 'Benjamin Martinez', 'Isabella Garcia', 'Lucas Robinson', 'Mia Johnson'];
  const companies = ['Quantum Labs', 'Atlas Ventures', 'Meridian Capital', 'Nexus Holdings', 'Apex Industries', 'Vertex Partners', 'Summit Group', 'Horizon Tech', 'Nova Systems', 'Stellar Corp'];
  const statuses = ['Hot', 'Warm', 'Cold', 'New'];
  const sources = ['LinkedIn', 'Website', 'Referral', 'Native Ad', 'Database', 'Outbound'];
  const titles = ['CEO', 'CFO', 'VP Sales', 'Director', 'Partner', 'Founder'];
  
  return Array.from({ length: 48 }, (_, i) => ({
    id: `lead-${clientId}-${i + 1}`,
    name: names[i % names.length],
    email: `${names[i % names.length].toLowerCase().replace(' ', '.')}@${companies[i % companies.length].toLowerCase().replace(/\s/g, '')}.com`,
    phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    company: companies[i % companies.length],
    title: titles[Math.floor(Math.random() * titles.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    source: sources[Math.floor(Math.random() * sources.length)],
    score: Math.floor(Math.random() * 100),
    value: Math.floor(Math.random() * 500000) + 10000,
    lastContact: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    interactions: Math.floor(Math.random() * 15) + 1,
  }));
};

const MOCK_LEADS_BY_CLIENT = {
  'client-1': generateMockLeads('client-1'),
  'client-2': generateMockLeads('client-2'),
  'client-3': generateMockLeads('client-3'),
};

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);
const createCache = () => {
  const cache = new Map();
  const TTL = 5 * 60 * 1000; // 5 minutes default
  
  return {
    get: (key) => {
      const item = cache.get(key);
      if (!item) return null;
      if (Date.now() > item.expiry) {
        cache.delete(key);
        return null;
      }
      return item.value;
    },
    set: (key, value, ttl = TTL) => {
      cache.set(key, { value, expiry: Date.now() + ttl });
    },
    invalidate: (key) => cache.delete(key),
    invalidatePattern: (pattern) => {
      for (const key of cache.keys()) {
        if (key.includes(pattern)) cache.delete(key);
      }
    },
    clear: () => cache.clear(),
    size: () => cache.size,
  };
};

const appCache = createCache();

const fmt = {
  currency: (v) => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v/1e3).toFixed(0)}K` : `$${v}`,
  date: (d) => {
    const diff = Math.floor((Date.now() - new Date(d)) / 864e5);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },
  initials: (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2),
  number: (n) => n.toLocaleString(),
};

// Fuzzy search function
const fuzzySearch = (query, items, keys = ['name']) => {
  if (!query || query.length < 1) return items;
  const q = query.toLowerCase().trim();
  
  return items.filter(item => {
    return keys.some(key => {
      const value = String(item[key] || '').toLowerCase();
      // Exact match
      if (value.includes(q)) return true;
      // Fuzzy: check if all characters appear in order
      let qi = 0;
      for (let i = 0; i < value.length && qi < q.length; i++) {
        if (value[i] === q[qi]) qi++;
      }
      return qi === q.length;
    });
  }).sort((a, b) => {
    // Prioritize exact matches
    const aExact = keys.some(k => String(a[k] || '').toLowerCase().startsWith(q));
    const bExact = keys.some(k => String(b[k] || '').toLowerCase().startsWith(q));
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return 0;
  });
};

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Avatar = ({ name, size = 40, src }) => {
  // Brand-aligned avatar gradients
  const gradients = [
    `linear-gradient(135deg, ${c.primary.DEFAULT}, ${c.primary.light})`,  // Space Blue
    `linear-gradient(135deg, ${c.accent.DEFAULT}, ${c.accent.light})`,    // Orange
    `linear-gradient(135deg, #3148B9, #F24C03)`,                           // Brand gradient
    `linear-gradient(135deg, ${c.primary.light}, #8b5cf6)`,               // Blue to purple
    `linear-gradient(135deg, #10b981, ${c.primary.DEFAULT})`,             // Green to blue
  ];
  const idx = name.charCodeAt(0) % gradients.length;
  
  return (
    <div style={{
      width: size, height: size, borderRadius: r.lg, flexShrink: 0,
      background: src ? 'transparent' : gradients[idx],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 600, color: '#fff', overflow: 'hidden',
      fontFamily: tokens.font.heading,
      boxShadow: `0 2px 8px rgba(0,0,0,0.2)`,
    }}>
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : fmt.initials(name)}
    </div>
  );
};

const UserOrgAvatar = ({ userName, orgName, userSize = 40, showOrg = true }) => {
  const orgSize = userSize * 0.65;
  
  return (
    <div style={{ position: 'relative', width: userSize + 8, height: userSize + 8 }}>
      {/* Org badge - positioned behind and offset */}
      {showOrg && orgName && (
        <div style={{
          position: 'absolute',
          bottom: 0, right: 0,
          width: orgSize, height: orgSize, borderRadius: r.md,
          background: `linear-gradient(135deg, ${c.gray[700]}, ${c.gray[600]})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: orgSize, fontWeight: 600, color: c.gray[300],
          fontFamily: tokens.font.sans,
          border: `2px solid ${c.gray[900]}`,
          zIndex: 1,
        }}>
          <Building2 size={orgSize * 0.5} />
        </div>
      )}
      {/* User avatar - on top */}
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}>
        <Avatar name={userName} size={userSize} />
      </div>
    </div>
  );
};

// Modal Overlay Component
const ModalOverlay = ({ children, onClose, maxWidth = 500 }) => (
  <div 
    onClick={onClose} 
    style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(2, 4, 9, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '40px 24px', overflowY: 'auto',
    }}
  >
    <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth, marginBottom: 40 }}>
      {children}
    </div>
  </div>
);

// Proper z-index file picker
const FileUploadModal = ({ isOpen, onClose, onUpload, acceptedTypes = '.csv,.xlsx,.json' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  }, []);
  
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };
  
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    
    // Simulate processing
    await new Promise(r => setTimeout(r, 2500));
    
    onUpload?.(selectedFiles);
    setUploading(false);
    setSelectedFiles([]);
    setUploadProgress(0);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <ModalOverlay onClose={onClose} maxWidth={560}>
      <Card padding={0} style={{ overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${c.gray[800]}` }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Upload Lead Data</h2>
          <button onClick={onClose} style={{ padding: 6, background: 'transparent', border: 'none', borderRadius: r.md, cursor: 'pointer', color: c.gray[400] }}>
            <X size={20} />
          </button>
        </div>
        
        {/* Drop Zone */}
        <div style={{ padding: 20 }}>
          <div
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: 40, textAlign: 'center', cursor: 'pointer',
              border: `2px dashed ${isDragging ? c.primary.DEFAULT : c.gray[700]}`,
              borderRadius: r.xl, background: isDragging ? c.primary[50] : c.gray[850],
              transition: tokens.transition.base,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes}
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Upload size={40} style={{ color: isDragging ? c.primary.DEFAULT : c.gray[500], marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 500, color: c.gray[200], marginBottom: 6 }}>
              {isDragging ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p style={{ fontSize: 13, color: c.gray[500], marginBottom: 16 }}>or click to browse</p>
            <p style={{ fontSize: 12, color: c.gray[600] }}>Supports CSV, Excel, and JSON files</p>
          </div>
          
          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[400], marginBottom: 10 }}>Selected Files ({selectedFiles.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedFiles.map((file, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: c.gray[850], borderRadius: r.lg }}>
                    <FileText size={18} style={{ color: c.primary.DEFAULT }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: c.gray[200], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
                      <p style={{ fontSize: 11, color: c.gray[500] }}>{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeFile(index); }} style={{ padding: 4, background: 'transparent', border: 'none', borderRadius: r.sm, cursor: 'pointer', color: c.gray[500] }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Upload Progress */}
          {uploading && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: c.gray[400] }}>Uploading...</span>
                <span style={{ fontSize: 13, color: c.primary.DEFAULT }}>{uploadProgress}%</span>
              </div>
              <div style={{ height: 6, background: c.gray[800], borderRadius: r.full, overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: tokens.gradients.brand, transition: 'width 200ms ease' }} />
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: `1px solid ${c.gray[800]}`, background: c.gray[850] }}>
          <Button variant="secondary" onClick={onClose} disabled={uploading}>Cancel</Button>
          <Button variant="gradient" icon={Upload} onClick={handleUpload} disabled={selectedFiles.length === 0 || uploading} loading={uploading}>
            {uploading ? 'Processing...' : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
          </Button>
        </div>
      </Card>
    </ModalOverlay>
  );
};

// Shows detailed metrics when clicking client card
const ClientMetricsModal = ({ isOpen, onClose, client, leads }) => {
  if (!isOpen || !client) return null;
  
  const clientLeads = leads || [];
  const stats = {
    total: clientLeads.length,
    hot: clientLeads.filter(l => l.status === 'Hot').length,
    warm: clientLeads.filter(l => l.status === 'Warm').length,
    cold: clientLeads.filter(l => l.status === 'Cold').length,
    value: clientLeads.reduce((s, l) => s + (l.value || 0), 0),
    avgScore: Math.round(clientLeads.reduce((s, l) => s + l.score, 0) / clientLeads.length) || 0,
    recentLeads: clientLeads.slice(0, 5),
    sources: clientLeads.reduce((acc, l) => {
      acc[l.source] = (acc[l.source] || 0) + 1;
      return acc;
    }, {}),
  };
  
  return (
    <ModalOverlay onClose={onClose} maxWidth={700}>
      <Card padding={0}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${c.gray[800]}`, background: tokens.gradients.brandSubtle }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={client.name} size={48} />
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>{client.name}</h2>
              <p style={{ fontSize: 14, color: c.gray[400] }}>{client.company}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: 8, background: c.gray[800], border: 'none', borderRadius: r.lg, cursor: 'pointer', color: c.gray[400] }}>
            <X size={20} />
          </button>
        </div>
        
        {/* Metrics Grid */}
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Leads', value: stats.total, color: c.gray[100] },
              { label: 'Hot Leads', value: stats.hot, color: c.hot.text },
              { label: 'Pipeline Value', value: fmt.currency(stats.value), color: c.success.DEFAULT },
              { label: 'Avg Score', value: stats.avgScore, color: c.primary.light },
            ].map((metric, i) => (
              <div key={i} style={{ padding: 16, background: c.gray[850], borderRadius: r.lg, textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: metric.color, fontFamily: tokens.font.heading }}>{metric.value}</p>
                <p style={{ fontSize: 12, color: c.gray[500], marginTop: 4 }}>{metric.label}</p>
              </div>
            ))}
          </div>
          
          {/* Source Breakdown */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[300], marginBottom: 12 }}>Lead Sources</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(stats.sources).map(([source, count]) => (
                <span key={source} style={{ padding: '6px 12px', background: c.gray[850], borderRadius: r.full, fontSize: 13, color: c.gray[300] }}>
                  {source}: <strong style={{ color: c.accent.DEFAULT }}>{count}</strong>
                </span>
              ))}
            </div>
          </div>
          
          {/* Recent Leads */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[300], marginBottom: 12 }}>Recent Leads</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.recentLeads.map(lead => (
                <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: c.gray[850], borderRadius: r.lg }}>
                  <Avatar name={lead.name} size={32} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[200] }}>{lead.name}</p>
                    <p style={{ fontSize: 12, color: c.gray[500] }}>{lead.company}</p>
                  </div>
                  <StatusBadge status={lead.status} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: c.gray[300] }}>{lead.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: `1px solid ${c.gray[800]}` }}>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary" icon={BarChart3}>View Full Analytics</Button>
        </div>
      </Card>
    </ModalOverlay>
  );
};

const StatusBadge = ({ status }) => {
  const config = c[status.toLowerCase()] || c.new;
  const icons = { hot: Flame, warm: Sparkles, cold: Snowflake, new: Zap };
  const Icon = icons[status.toLowerCase()] || Zap;
  
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: r.full,
      background: config.bg, border: `1px solid ${config.border}`,
      fontSize: 12, fontWeight: 500, color: config.text,
    }}>
      <Icon size={12} />
      {status}
    </span>
  );
};

// Progress indicator
const Score = ({ value, size = 'md' }) => {
  const color = value >= 75 ? c.success.DEFAULT : value >= 50 ? c.warning.DEFAULT : value >= 25 ? '#f97316' : c.error.DEFAULT;
  const widths = { sm: 40, md: 52, lg: 64 };
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: widths[size], height: 4, background: c.gray[800], borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 2, transition: tokens.transition.slow }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums', minWidth: 24 }}>{value}</span>
    </div>
  );
};

const Button = ({ children, variant = 'primary', size = 'md', icon: Icon, iconRight, loading, disabled, fullWidth, onClick, style = {} }) => {
  const [hovered, setHovered] = useState(false);
  
  const variants = {
    primary: { 
      bg: hovered ? c.primary.hover : c.primary.DEFAULT, 
      bgHover: c.primary.hover, 
      text: '#fff', 
      border: 'none',
      shadow: hovered ? tokens.shadow.glow : 'none',
    },
    accent: { 
      bg: hovered ? c.accent.dark : c.accent.DEFAULT, 
      bgHover: c.accent.dark, 
      text: '#fff', 
      border: 'none',
      shadow: hovered ? tokens.shadow.glowOrange : 'none',
    },
    gradient: {
      bg: tokens.gradients.brand,
      bgHover: tokens.gradients.brand,
      text: '#fff',
      border: 'none',
      shadow: hovered ? `0 0 20px rgba(49, 72, 185, 0.3), 0 0 40px rgba(242, 76, 3, 0.2)` : 'none',
    },
    secondary: { bg: 'transparent', bgHover: c.gray[800], text: c.gray[300], border: `1px solid ${c.gray[700]}`, shadow: 'none' },
    ghost: { bg: 'transparent', bgHover: c.gray[850], text: c.gray[400], border: 'none', shadow: 'none' },
    danger: { bg: c.error.muted, bgHover: 'rgba(239,68,68,0.2)', text: c.error.DEFAULT, border: 'none', shadow: 'none' },
  };
  const sizes = { sm: { px: 12, py: 6, fs: 13 }, md: { px: 16, py: 10, fs: 14 }, lg: { px: 20, py: 12, fs: 15 } };
  const v = variants[variant], s = sizes[size];
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: `${s.py}px ${s.px}px`, fontSize: s.fs, fontWeight: 500,
        fontFamily: tokens.font.sans,
        color: v.text, background: variant === 'gradient' ? v.bg : (hovered && !disabled ? v.bgHover : v.bg),
        border: v.border, borderRadius: r.md, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: tokens.transition.fast,
        width: fullWidth ? '100%' : 'auto', outline: 'none',
        boxShadow: v.shadow,
        ...style,
      }}
    >
      {loading ? <RefreshCw size={16} className="animate-spin" /> : Icon && !iconRight && <Icon size={16} />}
      {children}
      {Icon && iconRight && !loading && <Icon size={16} />}
    </button>
  );
};

const Input = ({ label, icon: Icon, error, ...props }) => {
  const [focused, setFocused] = useState(false);
  
  return (
    <div style={{ width: '100%' }}>
      {label && <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: c.gray[400], fontFamily: tokens.font.sans }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: focused ? c.primary.light : c.gray[500], transition: tokens.transition.fast }} />}
        <input
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: Icon ? '11px 12px 11px 40px' : '11px 12px',
            fontSize: 14, color: c.gray[100], background: c.gray[850],
            fontFamily: tokens.font.sans,
            border: `1px solid ${focused ? c.primary.DEFAULT : error ? c.error.DEFAULT : c.gray[700]}`,
            borderRadius: r.md, outline: 'none', transition: tokens.transition.fast,
            boxShadow: focused ? `0 0 0 3px ${c.primary[100]}` : 'none',
          }}
          {...props}
        />
      </div>
      {error && <p style={{ marginTop: 4, fontSize: 12, color: c.error.DEFAULT }}>{error}</p>}
    </div>
  );
};

const Card = ({ children, padding = 20, hover = false, onClick, accent = false, gradient = false, style = {} }) => {
  const [hovered, setHovered] = useState(false);
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: gradient ? tokens.gradients.card : c.gray[900],
        border: `1px solid ${accent ? c.accent.DEFAULT + '30' : hovered && hover ? c.gray[600] : c.gray[800]}`,
        borderRadius: r.xl, padding, cursor: onClick ? 'pointer' : 'default',
        transition: tokens.transition.base, 
        transform: hovered && hover ? 'translateY(-2px)' : 'none',
        boxShadow: hovered && hover ? tokens.shadow.card : 'none',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Subtle gradient overlay for depth */}
      {gradient && (
        <div style={{
          position: 'absolute', inset: 0, 
          background: tokens.gradients.blueRadial,
          pointerEvents: 'none',
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

const Metric = ({ label, value, change, trend, icon: Icon, iconColor, accent = false }) => (
  <Card hover gradient>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: 13, color: c.gray[400], marginBottom: 6, fontWeight: 500, fontFamily: tokens.font.sans }}>{label}</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: c.gray[100], letterSpacing: '-0.02em', lineHeight: 1.1, fontFamily: tokens.font.heading }}>{value}</p>
        {change && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
            {trend === 'up' ? <TrendingUp size={14} color={c.success.DEFAULT} /> : <TrendingDown size={14} color={c.error.DEFAULT} />}
            <span style={{ fontSize: 13, fontWeight: 500, color: trend === 'up' ? c.success.DEFAULT : c.error.DEFAULT, fontFamily: tokens.font.sans }}>{change}</span>
          </div>
        )}
      </div>
      {Icon && (
        <div style={{ 
          width: 44, height: 44, borderRadius: r.lg, 
          background: accent ? tokens.gradients.brand : `linear-gradient(135deg, ${c.primary[100]} 0%, rgba(242, 76, 3, 0.08) 100%)`, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: accent ? tokens.shadow.glowOrange : 'none',
        }}>
          <Icon size={22} color={accent ? '#fff' : c.primary.DEFAULT} style={{ opacity: 0.9 }} />
        </div>
      )}
    </div>
  </Card>
);

const Sidebar = ({ user, currentPage, setCurrentPage, onLogout, isOpen, onClose }) => {
  const isAdmin = user.role === 'admin';
  
  const navItems = isAdmin ? [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'upload', label: 'Import', icon: Upload },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'sequences', label: 'Sequences', icon: Zap },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'ai-insights', label: 'AI Assistant', icon: Brain },
    { id: 'integrations', label: 'Integrations', icon: RefreshCw },
    { id: 'compliance', label: 'Compliance', icon: CheckCircle2 },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'help', label: 'Help', icon: Lightbulb },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const NavItem = ({ item }) => {
    const active = currentPage === item.id;
    const [hovered, setHovered] = useState(false);
    const Icon = item.icon;
    
    return (
      <button
        onClick={() => { setCurrentPage(item.id); onClose?.(); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', fontSize: 14, fontWeight: active ? 500 : 400,
          fontFamily: tokens.font.sans,
          color: active ? c.gray[100] : hovered ? c.gray[200] : c.gray[400],
          background: active ? `linear-gradient(135deg, ${c.primary[100]} 0%, rgba(242, 76, 3, 0.05) 100%)` : hovered ? c.gray[850] : 'transparent',
          border: 'none', 
          borderLeft: active ? `2px solid ${c.accent.DEFAULT}` : '2px solid transparent',
          borderRadius: `0 ${r.lg}px ${r.lg}px 0`, 
          cursor: 'pointer',
          transition: tokens.transition.fast, textAlign: 'left',
          marginLeft: -2,
        }}
      >
        <Icon size={20} style={{ color: active ? c.accent.DEFAULT : hovered ? c.gray[300] : c.gray[500], flexShrink: 0, transition: tokens.transition.fast }} />
        <span style={{ flex: 1 }}>{item.label}</span>
        {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.accent.DEFAULT, boxShadow: `0 0 8px ${c.accent.DEFAULT}` }} />}
      </button>
    );
  };

  return (
    <>
      {isOpen && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 9, 0.8)', backdropFilter: 'blur(4px)', zIndex: 40 }} className="lg-hidden" />}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 256,
        background: tokens.gradients.blueDark,
        borderRight: `1px solid ${c.gray[800]}`,
        display: 'flex', flexDirection: 'column', zIndex: 50,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: tokens.transition.base,
      }} className="sidebar">
        {/* Decorative gradient overlay */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: 200, background: tokens.gradients.blueRadial, pointerEvents: 'none' }} />
        
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${c.gray[800]}`, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/bluestar-icon.svg" alt="BluestarAI" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: c.gray[100], letterSpacing: '-0.01em', fontFamily: tokens.font.heading }}>{CONFIG.appName}</p>
              <p style={{ fontSize: 10, color: c.accent.DEFAULT, fontFamily: tokens.font.sans, fontWeight: 500 }}>by {CONFIG.company}</p>
            </div>
          </div>
        </div>
        
        {/* Nav */}
        <nav style={{ flex: 1, padding: 12, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
          <p style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: c.gray[600], textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: tokens.font.sans }}>
            {isAdmin ? 'Admin' : 'Workspace'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.map(item => <NavItem key={item.id} item={item} />)}
          </div>
        </nav>
        
        {/* Stacked avatar with org */}
        <div style={{ padding: 12, borderTop: `1px solid ${c.gray[800]}`, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: c.gray[850], borderRadius: r.lg, border: `1px solid ${c.gray[800]}` }}>
            <UserOrgAvatar userName={user.name} orgName={user.company} userSize={34} />
            <div style={{ flex: 1, minWidth: 0, marginLeft: 4 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[200], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: tokens.font.sans }}>{user.name}</p>
              <p style={{ fontSize: 11, color: c.gray[500], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: tokens.font.sans }}>{user.company || 'Administrator'}</p>
            </div>
            <button onClick={onLogout} style={{ padding: 6, background: 'transparent', border: 'none', borderRadius: r.md, cursor: 'pointer', color: c.gray[500], transition: tokens.transition.fast }}
              onMouseEnter={(e) => { e.target.style.color = c.error.DEFAULT; e.target.style.background = c.error.muted; }}
              onMouseLeave={(e) => { e.target.style.color = c.gray[500]; e.target.style.background = 'transparent'; }}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const Header = ({ title, user, onMenuClick, onNavigate, onSelectLead }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [results, setResults] = useState([]);
  const leads = MOCK_LEADS_BY_CLIENT[user.id] || [];
  
  useEffect(() => {
    if (searchQuery.length > 1) {
      const q = searchQuery.toLowerCase();
      setResults(leads.filter(l => l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)).slice(0, 5));
    } else setResults([]);
  }, [searchQuery, leads]);
  
  return (
    <header style={{
      height: 64, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 20,
      background: `linear-gradient(90deg, ${c.gray[950]} 0%, ${c.gray[900]} 100%)`, 
      borderBottom: `1px solid ${c.gray[800]}`,
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      <button onClick={onMenuClick} style={{ padding: 8, background: 'transparent', border: 'none', borderRadius: r.md, cursor: 'pointer', color: c.gray[400] }} className="lg-hidden">
        <Menu size={22} />
      </button>
      
      <h1 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], letterSpacing: '-0.01em', fontFamily: tokens.font.heading }}>{title}</h1>
      
      {/* Search */}
      {user.role === 'client' && (
        <div style={{ flex: 1, maxWidth: 360, position: 'relative', marginLeft: 24 }} className="search-desktop">
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: searchFocused ? c.primary.light : c.gray[500], transition: tokens.transition.fast }} />
          <input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            style={{
              width: '100%', padding: '9px 12px 9px 40px', fontSize: 14, color: c.gray[100],
              fontFamily: tokens.font.sans,
              background: c.gray[900], border: `1px solid ${searchFocused ? c.primary.DEFAULT : c.gray[800]}`,
              borderRadius: r.lg, outline: 'none', transition: tokens.transition.fast,
              boxShadow: searchFocused ? `0 0 0 3px ${c.primary[100]}` : 'none',
            }}
          />
          {searchFocused && results.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8,
              background: c.gray[900], border: `1px solid ${c.gray[700]}`, borderRadius: r.lg,
              boxShadow: tokens.shadow.lg, overflow: 'hidden', zIndex: 100,
            }}>
              {results.map(lead => (
                <button key={lead.id} onClick={() => { onSelectLead?.(lead); onNavigate?.('leads'); setSearchQuery(''); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: tokens.transition.fast }}
                  onMouseEnter={(e) => e.currentTarget.style.background = c.gray[850]}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <Avatar name={lead.name} size={32} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[100], fontFamily: tokens.font.sans }}>{lead.name}</p>
                    <p style={{ fontSize: 12, color: c.gray[500], fontFamily: tokens.font.sans }}>{lead.company}</p>
                  </div>
                  <StatusBadge status={lead.status} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{ position: 'relative', padding: 9, background: c.gray[900], border: `1px solid ${c.gray[800]}`, borderRadius: r.lg, cursor: 'pointer', color: c.gray[400], transition: tokens.transition.fast }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = c.gray[700]}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = c.gray[800]}>
          <Bell size={18} />
          <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, background: c.accent.DEFAULT, borderRadius: '50%', boxShadow: `0 0 6px ${c.accent.DEFAULT}` }} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 12px 5px 5px', background: c.gray[900], border: `1px solid ${c.gray[800]}`, borderRadius: r.lg }} className="user-desktop">
          <Avatar name={user.name} size={30} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[200], fontFamily: tokens.font.sans }}>{user.name.split(' ')[0]}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('client');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    
    if (loginType === 'admin' && email === MOCK_USERS.admin.email && password === MOCK_USERS.admin.password) {
      onLogin(MOCK_USERS.admin);
    } else if (loginType === 'client') {
      const client = MOCK_USERS.clients.find(c => c.email === email && c.password === password);
      if (client) onLogin(client);
      else setError('Invalid email or password');
    } else setError('Invalid credentials');
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: c.gray[950] }}>
      {/* Brand background gradients */}
      <div style={{ position: 'fixed', inset: 0, background: tokens.gradients.blueDark, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(ellipse at 30% 20%, rgba(49, 72, 185, 0.15) 0%, transparent 50%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(ellipse at 80% 80%, rgba(242, 76, 3, 0.08) 0%, transparent 50%)`, pointerEvents: 'none' }} />
      
      {/* Decorative star element */}
      <div style={{ position: 'fixed', top: '10%', right: '15%', width: 300, height: 300, opacity: 0.03, pointerEvents: 'none' }}>
        <img src="/logo-white.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      
      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="/logo-colored.png" alt="BluestarAI" style={{ width: 64, height: 64, margin: '0 auto 16px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: c.gray[100], marginBottom: 6, fontFamily: tokens.font.heading }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: c.gray[400], fontFamily: tokens.font.sans }}>Sign in to <span style={{ color: c.accent.DEFAULT, fontWeight: 500 }}>{CONFIG.appName}</span></p>
        </div>
        
        <Card padding={28} gradient style={{ border: `1px solid ${c.gray[700]}` }}>
          {/* Toggle */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, padding: 4, background: c.gray[850], borderRadius: r.lg, border: `1px solid ${c.gray[800]}` }}>
            {['client', 'admin'].map(type => (
              <button key={type} onClick={() => setLoginType(type)}
                style={{
                  flex: 1, padding: '9px 0', fontSize: 14, fontWeight: 500, textTransform: 'capitalize',
                  fontFamily: tokens.font.sans,
                  color: loginType === type ? c.gray[100] : c.gray[500],
                  background: loginType === type ? `linear-gradient(135deg, ${c.primary[100]} 0%, rgba(242, 76, 3, 0.05) 100%)` : 'transparent',
                  border: loginType === type ? `1px solid ${c.primary.DEFAULT}40` : '1px solid transparent',
                  borderRadius: r.md, cursor: 'pointer', transition: tokens.transition.fast,
                }}>
                {type}
              </button>
            ))}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Email" type="email" icon={Mail} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="Password" type="password" icon={Lock} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: c.error.muted, borderRadius: r.md, color: c.error.DEFAULT, fontSize: 13, fontFamily: tokens.font.sans }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              
              <Button type="submit" fullWidth loading={loading} variant="gradient" style={{ marginTop: 8 }}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
          
          {/* Demo */}
          <div style={{ marginTop: 20, padding: 14, background: c.gray[850], borderRadius: r.lg, border: `1px solid ${c.gray[800]}` }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: c.gray[500], textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, fontFamily: tokens.font.sans }}>Demo Credentials</p>
            <p style={{ fontSize: 13, color: c.gray[400], fontFamily: tokens.font.mono }}>
              {loginType === 'admin' ? 'admin@bluestarai.world / admin123' : 'chris@azimont.com / client123'}
            </p>
          </div>
        </Card>
        
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: c.gray[600], fontFamily: tokens.font.sans }}>© 2025 <span style={{ color: c.primary.light }}>{CONFIG.company}</span></p>
      </div>
    </div>
  );
};

const Dashboard = ({ user }) => {
  const isAdmin = user.role === 'admin';
  const leads = isAdmin ? [] : (MOCK_LEADS_BY_CLIENT[user.id] || []);
  
  const stats = useMemo(() => {
    if (isAdmin) {
      const all = Object.values(MOCK_LEADS_BY_CLIENT).flat();
      return { clients: MOCK_USERS.clients.length, leads: all.length, active: all.filter(l => l.status !== 'Cold').length, value: all.reduce((s, l) => s + l.value, 0) };
    }
    return {
      total: leads.length,
      hot: leads.filter(l => l.status === 'Hot').length,
      warm: leads.filter(l => l.status === 'Warm').length,
      cold: leads.filter(l => l.status === 'Cold').length,
      value: leads.reduce((s, l) => s + l.value, 0),
      avgScore: Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) || 0,
    };
  }, [isAdmin, leads]);
  
  const topLeads = useMemo(() => [...leads].sort((a, b) => b.score - a.score).slice(0, 5), [leads]);
  const recentLeads = useMemo(() => [...leads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5), [leads]);

  if (isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <Metric label="Total Clients" value={stats.clients} icon={Users} iconColor={c.primary[100]} />
          <Metric label="Total Leads" value={fmt.number(stats.leads)} icon={Target} iconColor={c.success.muted} />
          <Metric label="Active Leads" value={fmt.number(stats.active)} icon={Activity} change="+12%" trend="up" />
          <Metric label="Pipeline Value" value={fmt.currency(stats.value)} icon={BarChart3} />
        </div>
        
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: c.gray[100], marginBottom: 16 }}>Active Clients</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MOCK_USERS.clients.map(client => {
              const clientLeads = MOCK_LEADS_BY_CLIENT[client.id] || [];
              const hot = clientLeads.filter(l => l.status === 'Hot').length;
              return (
                <div key={client.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: c.gray[850], borderRadius: r.lg, border: `1px solid ${c.gray[800]}` }}>
                  <Avatar name={client.name} size={38} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[100] }}>{client.name}</p>
                    <p style={{ fontSize: 13, color: c.gray[500] }}>{client.company}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: c.gray[200] }}>{clientLeads.length} leads</p>
                    <p style={{ fontSize: 12, color: c.hot.text }}>{hot} hot</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  // Client Dashboard
  const greeting = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening';
  
  // month-over-month change
  const lastMonthStats = useMemo(() => ({
    total: Math.round(stats.total * 0.969),
    value: Math.round(stats.value * 0.969),
    avgScore: Math.round(stats.avgScore * 0.969),
    hot: Math.round(stats.hot * 0.969),
  }), [stats]);
  
  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return '+0.0%';
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };
  
  const StatCard = ({ label, value, icon: Icon, currentVal, previousVal }) => {
    const trend = calculateTrend(currentVal || 0, previousVal || 0);
    const isPositive = !trend.startsWith('-');
    
    return (
      <div style={{
        background: 'linear-gradient(180deg, rgba(46, 51, 90, 0) 0%, rgba(28, 27, 51, 0.2) 100%)',
        borderRadius: 20,
        padding: '24px',
        border: '1px solid #3148B9',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        minWidth: 0,
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 140,
      }}>
        {/* Background glow effects */}
        <div style={{
          position: 'absolute',
          bottom: -40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: 80,
          background: 'radial-gradient(ellipse at center, rgba(49, 72, 185, 0.3) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: 20,
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        
        {/* Icon and stats */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative', zIndex: 1 }}>
          {/* Glassmorphic Icon container */}
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 14,
            background: 'linear-gradient(180deg, rgba(46, 51, 90, 0.5) 0%, rgba(28, 27, 51, 0.3) 100%)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid rgba(172, 186, 253, 0.15)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Inner glow */}
            <div style={{
              position: 'absolute',
              bottom: -20,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              height: 40,
              background: 'radial-gradient(ellipse at center, rgba(49, 72, 185, 0.5) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <Icon size={28} style={{ color: '#94a3b8', position: 'relative', zIndex: 1 }} />
          </div>
          
          {/* Label and value */}
          <div style={{ paddingTop: 4 }}>
            <p style={{ 
              fontSize: 14, 
              color: '#94a3b8', 
              marginBottom: 8, 
              fontFamily: tokens.font.sans,
              fontWeight: 400,
            }}>{label}</p>
            <p style={{ 
              fontSize: 40, 
              fontWeight: 600, 
              color: '#ffffff', 
              fontFamily: tokens.font.heading, 
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>{value}</p>
          </div>
        </div>
        
        {/* Trend indicator */}
        <div style={{ 
          textAlign: 'right', 
          flexShrink: 0, 
          position: 'relative', 
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            marginBottom: 4,
          }}>
            {/* Trend arrow */}
            {isPositive ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 12.5L10 7.5M10 7.5H6.25M10 7.5V11.25" stroke="#63D2A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 7.5L10 12.5M10 12.5H6.25M10 12.5V8.75" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span style={{ 
              fontSize: 15, 
              fontWeight: 600, 
              color: isPositive ? '#63D2A1' : '#ef4444',
            }}>{trend}</span>
          </div>
          <p style={{ 
            fontSize: 12, 
            color: '#64748b',
            lineHeight: 1.3,
          }}>From Last<br/>Month</p>
        </div>
      </div>
    );
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero banner matching design mockup exactly */}
      <div style={{ 
        padding: '32px 40px', 
        background: 'linear-gradient(135deg, #020617 0%, #0a1628 50%, #0c1e3d 100%)',
        borderRadius: 20, 
        border: '1px solid #3148B9',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 180,
      }}>
        {/* Bottom glow effects */}
        <div style={{ 
          position: 'absolute', 
          bottom: -60, 
          left: '30%', 
          width: '40%', 
          height: 120, 
          background: 'radial-gradient(ellipse at center bottom, rgba(49, 72, 185, 0.4) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: '35%', 
          width: '30%', 
          height: 30, 
          background: 'radial-gradient(ellipse at center bottom, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        
        <div style={{ 
          position: 'absolute', 
          right: 30, 
          top: '50%', 
          transform: 'translateY(-50%)',
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img 
            src="/Group_1597880443.svg" 
            alt="" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 40px rgba(49, 72, 185, 0.4))',
            }} 
          />
        </div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ 
            fontSize: 22, 
            color: '#94a3b8', 
            marginBottom: 8, 
            fontFamily: tokens.font.sans, 
            fontWeight: 400,
          }}>Good {greeting},</p>
          <h2 style={{ 
            fontSize: 52, 
            fontWeight: 700, 
            color: '#ffffff', 
            fontFamily: tokens.font.heading, 
            marginBottom: 16,
            letterSpacing: '-0.02em',
          }}>
            {user.name.split(' ')[0]}
          </h2>
          <p style={{ 
            fontSize: 16, 
            color: '#64748b', 
            fontFamily: tokens.font.sans,
          }}>Here's what's happening today</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <StatCard 
          label="Total Leads" 
          value={stats.total} 
          icon={Users}
          currentVal={stats.total}
          previousVal={lastMonthStats.total}
        />
        <StatCard 
          label="Pipelines Value" 
          value={fmt.currency(stats.value)} 
          icon={BarChart3}
          currentVal={stats.value}
          previousVal={lastMonthStats.value}
        />
        <StatCard 
          label="Average Score" 
          value={stats.avgScore} 
          icon={Target}
          currentVal={stats.avgScore}
          previousVal={lastMonthStats.avgScore}
        />
        <StatCard 
          label="Hot Leads" 
          value={stats.hot} 
          icon={Flame}
          currentVal={stats.hot}
          previousVal={lastMonthStats.hot}
        />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: c.gray[100] }}>Top Leads</h3>
            <span style={{ fontSize: 13, color: c.gray[500] }}>By score</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topLeads.map((lead, i) => (
              <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: c.gray[850], borderRadius: r.lg }}>
                <span style={{
                  width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600, borderRadius: 6,
                  color: i < 3 ? c.primary.DEFAULT : c.gray[500],
                  background: i < 3 ? c.primary[100] : 'transparent',
                }}>{i + 1}</span>
                <Avatar name={lead.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[100], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.name}</p>
                  <p style={{ fontSize: 12, color: c.gray[500], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.company}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 70, height: 6, background: c.gray[800], borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${lead.score}%`, 
                      height: '100%', 
                      background: lead.score >= 80 ? '#63D2A1' : lead.score >= 60 ? '#eab308' : '#ef4444',
                      borderRadius: 3,
                    }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: lead.score >= 80 ? '#63D2A1' : lead.score >= 60 ? '#eab308' : '#ef4444', minWidth: 30 }}>{lead.score}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: c.gray[100] }}>Recent Leads</h3>
            <span style={{ fontSize: 13, color: c.gray[500] }}>Last 7 days</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentLeads.map(lead => (
              <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: c.gray[850], borderRadius: r.lg }}>
                <Avatar name={lead.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[100], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.name}</p>
                  <p style={{ fontSize: 12, color: c.gray[500] }}>{lead.source} · {fmt.date(lead.createdAt)}</p>
                </div>
                <StatusBadge status={lead.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// LEADS PAGE

const LeadsPage = ({ user, highlightLead }) => {
  const [leads, setLeads] = useState(MOCK_LEADS_BY_CLIENT[user.id] || []);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('score');
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const handleImportLeads = (importedLeads) => {
    setLeads(prev => [...importedLeads, ...prev]);
    setShowImport(false);
  };
  
  const filtered = useMemo(() => {
    return leads
      .filter(l => {
        if (status !== 'all' && l.status !== status) return false;
        if (search) {
          const q = search.toLowerCase();
          return l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.email.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === 'score') return b.score - a.score;
        if (sort === 'value') return b.value - a.value;
        if (sort === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
        return a.name.localeCompare(b.name);
      });
  }, [leads, search, status, sort]);
  
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeads = filtered.slice(startIndex, endIndex);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, sort, itemsPerPage]);
  
  const stats = useMemo(() => ({
    total: leads.length,
    hot: leads.filter(l => l.status === 'Hot').length,
    warm: leads.filter(l => l.status === 'Warm').length,
    cold: leads.filter(l => l.status === 'Cold').length,
  }), [leads]);
  
  const updateLead = (updatedLead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    setSelectedLead(updatedLead);
  };
  
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 32, padding: '14px 20px', background: c.gray[900], borderRadius: r.xl, border: `1px solid ${c.gray[800]}` }}>
        {[
          { label: 'Total', value: stats.total, color: c.gray[100] },
          { label: 'Hot', value: stats.hot, color: c.hot.text },
          { label: 'Warm', value: stats.warm, color: c.warm.text },
          { label: 'Cold', value: stats.cold, color: c.cold.text },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 13, color: c.gray[500] }}>{s.label}</span>
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, maxWidth: 300, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.gray[500] }} />
          <input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 40px', fontSize: 14, color: c.gray[100], background: c.gray[900], border: `1px solid ${c.gray[800]}`, borderRadius: r.lg, outline: 'none' }}
          />
        </div>
        
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          style={{ padding: '9px 14px', fontSize: 14, color: c.gray[300], background: c.gray[900], border: `1px solid ${c.gray[800]}`, borderRadius: r.lg, outline: 'none', cursor: 'pointer' }}>
          <option value="all">All Status</option>
          <option value="Hot">Hot</option>
          <option value="Warm">Warm</option>
          <option value="Cold">Cold</option>
          <option value="New">New</option>
        </select>
        
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          style={{ padding: '9px 14px', fontSize: 14, color: c.gray[300], background: c.gray[900], border: `1px solid ${c.gray[800]}`, borderRadius: r.lg, outline: 'none', cursor: 'pointer' }}>
          <option value="score">Sort by Score</option>
          <option value="value">Sort by Value</option>
          <option value="recent">Most Recent</option>
          <option value="name">Alphabetical</option>
        </select>
        
        <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}
          style={{ padding: '9px 14px', fontSize: 14, color: c.gray[300], background: c.gray[900], border: `1px solid ${c.gray[800]}`, borderRadius: r.lg, outline: 'none', cursor: 'pointer' }}>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button variant="gradient" icon={Upload} onClick={() => setShowImport(true)}>Import</Button>
          <Button variant="secondary" icon={Download} onClick={() => setShowExport(true)}>Export</Button>
        </div>
      </div>
      
      <Card padding={0} style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Lead', 'Company', 'Status', 'Score', 'Value', 'Source', 'Verified'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: c.gray[500], textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${c.gray[800]}`, background: c.gray[850] }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.map(lead => {
                const highlight = highlightLead?.id === lead.id;
                return (
                  <tr key={lead.id} 
                    onClick={() => setSelectedLead(lead)}
                    style={{ background: highlight ? c.primary[50] : 'transparent', transition: tokens.transition.fast, cursor: 'pointer' }}
                    onMouseEnter={(e) => { if (!highlight) e.currentTarget.style.background = c.gray[850]; }}
                    onMouseLeave={(e) => { if (!highlight) e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${c.gray[850]}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={lead.name} size={34} />
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[100] }}>{lead.name}</p>
                          <p style={{ fontSize: 12, color: c.gray[500] }}>{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${c.gray[850]}` }}>
                      <p style={{ fontSize: 14, color: c.gray[200] }}>{lead.company}</p>
                      <p style={{ fontSize: 12, color: c.gray[500] }}>{lead.title}</p>
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${c.gray[850]}` }}><StatusBadge status={lead.status} /></td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${c.gray[850]}` }}><Score value={lead.score} /></td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${c.gray[850]}`, fontSize: 14, fontWeight: 500, color: c.gray[200] }}>{fmt.currency(lead.value)}</td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${c.gray[850]}`, fontSize: 13, color: c.gray[400] }}>{lead.source}</td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${c.gray[850]}` }}>
                      <VerificationBadge lead={lead} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filtered.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Search size={40} style={{ color: c.gray[600], marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 500, color: c.gray[400], marginBottom: 4 }}>No leads found</p>
            <p style={{ fontSize: 13, color: c.gray[500] }}>Try adjusting your filters</p>
          </div>
        )}
        
        {filtered.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${c.gray[800]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 13, color: c.gray[500] }}>
              Showing {startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length} leads
            </p>
            
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 10px', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: r.md, cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  background: c.gray[800], color: currentPage === 1 ? c.gray[600] : c.gray[300],
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}>
                Previous
              </button>
              
              {getPageNumbers().map((pageNum, idx) => (
                pageNum === '...' ? (
                  <span key={`ellipsis-${idx}`} style={{ padding: '6px 8px', fontSize: 13, color: c.gray[500] }}>...</span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    style={{
                      padding: '6px 12px', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: r.md, cursor: 'pointer',
                      background: currentPage === pageNum ? c.primary.DEFAULT : c.gray[800],
                      color: currentPage === pageNum ? '#fff' : c.gray[300],
                    }}>
                    {pageNum}
                  </button>
                )
              ))}
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 10px', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: r.md, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  background: c.gray[800], color: currentPage === totalPages ? c.gray[600] : c.gray[300],
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}>
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
      
      {showExport && <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} data={filtered} />}
      
      {showImport && (
        <LeadImportModal 
          onClose={() => setShowImport(false)}
          onImport={handleImportLeads}
          existingLeads={leads}
        />
      )}
      
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)}
          onUpdate={updateLead}
        />
      )}
    </div>
  );
};

const VerificationBadge = ({ lead }) => {
  const isEmailVerified = lead.emailVerified;
  const isEnriched = lead.enriched;
  
  if (isEmailVerified && isEnriched) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: r.full, background: c.success.muted, color: c.success.DEFAULT, fontSize: 11, fontWeight: 500 }}>
        <CheckCircle2 size={12} /> Verified
      </span>
    );
  }
  
  if (isEmailVerified || isEnriched) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: r.full, background: c.warning.muted, color: c.warning.DEFAULT, fontSize: 11, fontWeight: 500 }}>
        <AlertCircle size={12} /> Partial
      </span>
    );
  }
  
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: r.full, background: c.gray[800], color: c.gray[500], fontSize: 11, fontWeight: 500 }}>
      <Clock size={12} /> Pending
    </span>
  );
};

const LEAD_FIELDS = [
  { id: 'name', label: 'Full Name', required: true, example: 'John Smith' },
  { id: 'email', label: 'Email Address', required: true, example: 'john@company.com' },
  { id: 'company', label: 'Company', required: true, example: 'Acme Corp' },
  { id: 'title', label: 'Job Title', required: false, example: 'VP of Sales' },
  { id: 'phone', label: 'Phone Number', required: false, example: '+1 555-123-4567' },
  { id: 'linkedin', label: 'LinkedIn URL', required: false, example: 'linkedin.com/in/johnsmith' },
  { id: 'website', label: 'Website', required: false, example: 'www.company.com' },
  { id: 'industry', label: 'Industry', required: false, example: 'Technology' },
  { id: 'employees', label: 'Company Size', required: false, example: '100-500' },
  { id: 'revenue', label: 'Revenue', required: false, example: '$10M-$50M' },
  { id: 'location', label: 'Location', required: false, example: 'New York, NY' },
  { id: 'source', label: 'Lead Source', required: false, example: 'LinkedIn' },
  { id: 'notes', label: 'Notes', required: false, example: 'Met at conference' },
  { id: 'value', label: 'Deal Value', required: false, example: '50000' },
  { id: 'status', label: 'Status', required: false, example: 'New' },
];

const LeadImportModal = ({ onClose, onImport, existingLeads = [] }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview, 4: Results
  const [file, setFile] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [duplicateHandling, setDuplicateHandling] = useState('skip'); // skip, update, allow
  const fileInputRef = useRef(null);
  
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return { headers: [], data: [] };
    
    const parseRow = (row) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    
    const headers = parseRow(lines[0]);
    const data = lines.slice(1).map(line => {
      const values = parseRow(line);
      const row = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });
    
    return { headers, data };
  };
  
  const parseJSON = (text) => {
    const data = JSON.parse(text);
    const rows = Array.isArray(data) ? data : [data];
    if (rows.length === 0) return { headers: [], data: [] };
    
    const headers = [...new Set(rows.flatMap(row => Object.keys(row)))];
    return { headers, data: rows };
  };
  
  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;
    
    setFile(selectedFile);
    const text = await selectedFile.text();
    
    let parsed;
    if (selectedFile.name.endsWith('.json')) {
      try {
        parsed = parseJSON(text);
      } catch (e) {
        alert('Invalid JSON file');
        return;
      }
    } else {
      parsed = parseCSV(text);
    }
    
    setHeaders(parsed.headers);
    setRawData(parsed.data);
    
    const autoMapping = {};
    parsed.headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z]/g, '');
      const matchedField = LEAD_FIELDS.find(f => {
        const normalizedField = f.label.toLowerCase().replace(/[^a-z]/g, '');
        const normalizedId = f.id.toLowerCase();
        return normalizedHeader.includes(normalizedField) || 
               normalizedHeader.includes(normalizedId) ||
               normalizedField.includes(normalizedHeader) ||
               normalizedHeader === normalizedId;
      });
      if (matchedField) {
        autoMapping[header] = matchedField.id;
      }
    });
    setFieldMapping(autoMapping);
    
    setStep(2);
  };
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  
  const validateAndPreview = () => {
    const errors = [];
    const preview = [];
    const emailSet = new Set(existingLeads.map(l => l.email?.toLowerCase()));
    
    rawData.forEach((row, index) => {
      const lead = {};
      const rowErrors = [];
      
      Object.entries(fieldMapping).forEach(([csvHeader, leadField]) => {
        if (leadField && row[csvHeader]) {
          lead[leadField] = row[csvHeader];
        }
      });
      
      LEAD_FIELDS.filter(f => f.required).forEach(field => {
        if (!lead[field.id] || !lead[field.id].trim()) {
          rowErrors.push(`Missing ${field.label}`);
        }
      });
      
      if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
        rowErrors.push('Invalid email format');
      }
      
      const isDuplicate = lead.email && emailSet.has(lead.email.toLowerCase());
      if (isDuplicate && duplicateHandling === 'skip') {
        rowErrors.push('Duplicate email (will be skipped)');
      }
      
      preview.push({
        index: index + 1,
        data: lead,
        errors: rowErrors,
        isDuplicate,
        isValid: rowErrors.length === 0 || (isDuplicate && duplicateHandling === 'skip'),
      });
      
      if (rowErrors.length > 0) {
        errors.push({ row: index + 1, errors: rowErrors });
      }
    });
    
    setPreviewData(preview);
    setValidationErrors(errors);
    setStep(3);
  };
  
  // Execute import
  const executeImport = async () => {
    setImporting(true);
    
    const results = {
      total: previewData.length,
      imported: 0,
      skipped: 0,
      errors: 0,
      duplicates: 0,
      leads: [],
    };
    
    await new Promise(r => setTimeout(r, 500));
    
    const existingEmails = new Set(existingLeads.map(l => l.email?.toLowerCase()));
    
    previewData.forEach((item) => {
      if (item.isDuplicate) {
        if (duplicateHandling === 'skip') {
          results.skipped++;
          results.duplicates++;
          return;
        }
      }
      
      if (item.errors.length > 0 && !item.isDuplicate) {
        results.errors++;
        return;
      }
      
      const newLead = {
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.data.name || 'Unknown',
        email: item.data.email || '',
        company: item.data.company || 'Unknown',
        title: item.data.title || '',
        phone: item.data.phone || '',
        linkedin: item.data.linkedin || '',
        website: item.data.website || '',
        industry: item.data.industry || '',
        employees: item.data.employees || '',
        location: item.data.location || '',
        source: item.data.source || 'CSV Import',
        notes: item.data.notes || '',
        value: parseInt(item.data.value) || Math.floor(Math.random() * 50000) + 5000,
        status: item.data.status || 'New',
        score: Math.floor(Math.random() * 40) + 30,
        createdAt: new Date().toISOString(),
        emailVerified: false,
        enriched: false,
        activities: [],
        tags: ['Imported'],
      };
      
      results.leads.push(newLead);
      results.imported++;
    });
    
    setImportResults(results);
    setImporting(false);
    setStep(4);
  };
  
  const downloadTemplate = () => {
    const headers = LEAD_FIELDS.map(f => f.label).join(',');
    const example = LEAD_FIELDS.map(f => f.example).join(',');
    const csv = `${headers}\n${example}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const completeImport = () => {
    if (importResults && importResults.leads.length > 0) {
      onImport(importResults.leads);
    } else {
      onClose();
    }
  };
  
  const validCount = previewData.filter(p => p.isValid && !p.isDuplicate).length;
  const errorCount = previewData.filter(p => !p.isValid && !p.isDuplicate).length;
  const duplicateCount = previewData.filter(p => p.isDuplicate).length;

  return (
    <ModalOverlay onClose={onClose} maxWidth={step === 3 ? 900 : 600}>
      <Card padding={0} style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${c.gray[800]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Import Leads</h2>
            <p style={{ fontSize: 13, color: c.gray[500], marginTop: 2 }}>
              {step === 1 && 'Upload your CSV, Excel, or JSON file'}
              {step === 2 && 'Map your columns to lead fields'}
              {step === 3 && 'Review and validate your data'}
              {step === 4 && 'Import complete'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} style={{ color: c.gray[500] }} />
          </button>
        </div>
        
        {/* Progress Steps */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${c.gray[850]}`, display: 'flex', gap: 8 }}>
          {[
            { num: 1, label: 'Upload' },
            { num: 2, label: 'Map Fields' },
            { num: 3, label: 'Preview' },
            { num: 4, label: 'Complete' },
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: r.full, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step >= s.num ? tokens.gradients.brand : c.gray[800],
                  color: step >= s.num ? '#fff' : c.gray[500],
                  fontSize: 13, fontWeight: 600,
                }}>
                  {step > s.num ? <CheckCircle2 size={16} /> : s.num}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: step >= s.num ? c.gray[200] : c.gray[500] }}>{s.label}</span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 2, background: step > s.num ? c.primary.DEFAULT : c.gray[800], borderRadius: 1 }} />}
            </React.Fragment>
          ))}
        </div>
        
        {/* Content */}
        <div style={{ padding: 24 }}>
          {/* Step 1: Upload */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Drag & Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? c.primary.DEFAULT : c.gray[700]}`,
                  borderRadius: r.xl,
                  padding: 50,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragActive ? c.primary[50] : c.gray[850],
                  transition: tokens.transition.fast,
                }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
                <Upload size={40} style={{ color: dragActive ? c.primary.DEFAULT : c.gray[500], margin: '0 auto 16px' }} />
                <p style={{ fontSize: 15, fontWeight: 500, color: c.gray[200], marginBottom: 6 }}>
                  Drop your file here or click to browse
                </p>
                <p style={{ fontSize: 13, color: c.gray[500] }}>
                  Supports CSV, Excel (.xlsx), and JSON files
                </p>
              </div>
              
              <Card style={{ background: c.gray[850] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: r.lg, background: c.primary[100], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={22} style={{ color: c.primary.DEFAULT }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[200] }}>Download Template</p>
                    <p style={{ fontSize: 12, color: c.gray[500] }}>Get a CSV template with all available fields</p>
                  </div>
                  <Button variant="secondary" size="sm" icon={Download} onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}>
                    Download
                  </Button>
                </div>
              </Card>
              
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: c.gray[400], marginBottom: 10 }}>Supported Fields</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {LEAD_FIELDS.map(field => (
                    <span key={field.id} style={{
                      padding: '4px 10px', borderRadius: r.full, fontSize: 12,
                      background: field.required ? c.primary[100] : c.gray[800],
                      color: field.required ? c.primary.DEFAULT : c.gray[400],
                    }}>
                      {field.label}{field.required && ' *'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Card style={{ background: c.gray[850] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={18} style={{ color: c.primary.DEFAULT }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[200] }}>{file?.name}</p>
                    <p style={{ fontSize: 12, color: c.gray[500] }}>{rawData.length} rows found</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setStep(1); setFile(null); }}>Change File</Button>
                </div>
              </Card>
              
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: c.gray[400], marginBottom: 12 }}>Map Your Columns</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {headers.map(header => (
                    <div key={header} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 180, padding: '10px 14px', background: c.gray[850], borderRadius: r.md, fontSize: 13, color: c.gray[300], fontFamily: tokens.font.mono }}>
                        {header}
                      </div>
                      <ArrowRight size={18} style={{ color: c.gray[600] }} />
                      <select
                        value={fieldMapping[header] || ''}
                        onChange={(e) => setFieldMapping(prev => ({ ...prev, [header]: e.target.value }))}
                        style={{
                          flex: 1, padding: '10px 14px', fontSize: 14, color: c.gray[200],
                          background: c.gray[900], border: `1px solid ${c.gray[800]}`,
                          borderRadius: r.md, outline: 'none', cursor: 'pointer',
                        }}>
                        <option value="">-- Skip this column --</option>
                        {LEAD_FIELDS.map(field => (
                          <option key={field.id} value={field.id}>
                            {field.label}{field.required ? ' *' : ''}
                          </option>
                        ))}
                      </select>
                      {fieldMapping[header] && (
                        <CheckCircle2 size={18} style={{ color: c.success.DEFAULT }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{ padding: 14, background: c.gray[850], borderRadius: r.lg }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: c.gray[400], marginBottom: 8 }}>Required Fields</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  {LEAD_FIELDS.filter(f => f.required).map(field => {
                    const isMapped = Object.values(fieldMapping).includes(field.id);
                    return (
                      <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {isMapped ? (
                          <CheckCircle2 size={14} style={{ color: c.success.DEFAULT }} />
                        ) : (
                          <AlertCircle size={14} style={{ color: c.error.DEFAULT }} />
                        )}
                        <span style={{ fontSize: 12, color: isMapped ? c.gray[300] : c.error.DEFAULT }}>{field.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Total Rows', value: previewData.length, color: c.gray[200] },
                  { label: 'Valid', value: validCount, color: c.success.DEFAULT },
                  { label: 'Duplicates', value: duplicateCount, color: c.warning.DEFAULT },
                  { label: 'Errors', value: errorCount, color: c.error.DEFAULT },
                ].map(stat => (
                  <div key={stat.label} style={{ padding: 14, background: c.gray[850], borderRadius: r.lg, textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</p>
                    <p style={{ fontSize: 12, color: c.gray[500] }}>{stat.label}</p>
                  </div>
                ))}
              </div>
              
              {duplicateCount > 0 && (
                <Card style={{ background: c.warning.muted, border: `1px solid ${c.warning.DEFAULT}30` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AlertCircle size={20} style={{ color: c.warning.DEFAULT }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[100] }}>
                        {duplicateCount} duplicate email{duplicateCount > 1 ? 's' : ''} found
                      </p>
                      <p style={{ fontSize: 12, color: c.gray[400] }}>Choose how to handle duplicates:</p>
                    </div>
                    <select
                      value={duplicateHandling}
                      onChange={(e) => { setDuplicateHandling(e.target.value); validateAndPreview(); }}
                      style={{
                        padding: '8px 12px', fontSize: 13, background: c.gray[900],
                        border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[200],
                      }}>
                      <option value="skip">Skip duplicates</option>
                      <option value="update">Update existing</option>
                      <option value="allow">Import anyway</option>
                    </select>
                  </div>
                </Card>
              )}
              
              <div style={{ background: c.gray[850], borderRadius: r.lg, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.gray[800]}` }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: c.gray[400] }}>Data Preview</p>
                </div>
                <div style={{ overflowX: 'auto', maxHeight: 300 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: c.gray[500], background: c.gray[900], position: 'sticky', top: 0 }}>#</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: c.gray[500], background: c.gray[900], position: 'sticky', top: 0 }}>Status</th>
                        {LEAD_FIELDS.filter(f => Object.values(fieldMapping).includes(f.id)).map(field => (
                          <th key={field.id} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: c.gray[500], background: c.gray[900], position: 'sticky', top: 0, whiteSpace: 'nowrap' }}>
                            {field.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 50).map((row) => (
                        <tr key={row.index} style={{ background: row.errors.length > 0 ? c.error.muted + '30' : row.isDuplicate ? c.warning.muted + '30' : 'transparent' }}>
                          <td style={{ padding: '10px 12px', color: c.gray[500], borderBottom: `1px solid ${c.gray[800]}` }}>{row.index}</td>
                          <td style={{ padding: '10px 12px', borderBottom: `1px solid ${c.gray[800]}` }}>
                            {row.errors.length === 0 && !row.isDuplicate ? (
                              <CheckCircle2 size={16} style={{ color: c.success.DEFAULT }} />
                            ) : row.isDuplicate ? (
                              <span title="Duplicate" style={{ color: c.warning.DEFAULT }}><AlertCircle size={16} /></span>
                            ) : (
                              <span title={row.errors.join(', ')} style={{ color: c.error.DEFAULT }}><AlertCircle size={16} /></span>
                            )}
                          </td>
                          {LEAD_FIELDS.filter(f => Object.values(fieldMapping).includes(f.id)).map(field => (
                            <td key={field.id} style={{ padding: '10px 12px', color: c.gray[300], borderBottom: `1px solid ${c.gray[800]}`, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {row.data[field.id] || <span style={{ color: c.gray[600] }}>—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.length > 50 && (
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${c.gray[800]}`, fontSize: 12, color: c.gray[500], textAlign: 'center' }}>
                    Showing first 50 rows of {previewData.length}
                  </div>
                )}
              </div>
              
              {errorCount > 0 && (
                <div style={{ padding: 14, background: c.error.muted, borderRadius: r.lg, border: `1px solid ${c.error.DEFAULT}30` }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: c.error.DEFAULT, marginBottom: 8 }}>
                    {errorCount} row{errorCount > 1 ? 's' : ''} with errors (will be skipped)
                  </p>
                  <div style={{ maxHeight: 100, overflow: 'auto', fontSize: 12, color: c.gray[300] }}>
                    {validationErrors.slice(0, 10).map((err, i) => (
                      <p key={i}>Row {err.row}: {err.errors.join(', ')}</p>
                    ))}
                    {validationErrors.length > 10 && (
                      <p style={{ color: c.gray[500] }}>...and {validationErrors.length - 10} more</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {step === 4 && importResults && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', textAlign: 'center', padding: 20 }}>
              <div style={{
                width: 80, height: 80, borderRadius: r.full,
                background: importResults.imported > 0 ? c.success.muted : c.warning.muted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {importResults.imported > 0 ? (
                  <CheckCircle2 size={40} style={{ color: c.success.DEFAULT }} />
                ) : (
                  <AlertCircle size={40} style={{ color: c.warning.DEFAULT }} />
                )}
              </div>
              
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: c.gray[100], marginBottom: 4 }}>
                  {importResults.imported > 0 ? 'Import Complete!' : 'No Leads Imported'}
                </h3>
                <p style={{ fontSize: 14, color: c.gray[400] }}>
                  {importResults.imported} lead{importResults.imported !== 1 ? 's' : ''} successfully imported
                </p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, width: '100%', maxWidth: 400 }}>
                {[
                  { label: 'Imported', value: importResults.imported, color: c.success.DEFAULT },
                  { label: 'Skipped', value: importResults.skipped, color: c.warning.DEFAULT },
                  { label: 'Errors', value: importResults.errors, color: c.error.DEFAULT },
                ].map(stat => (
                  <div key={stat.label} style={{ padding: 16, background: c.gray[850], borderRadius: r.lg }}>
                    <p style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</p>
                    <p style={{ fontSize: 12, color: c.gray[500] }}>{stat.label}</p>
                  </div>
                ))}
              </div>
              
              {importResults.imported > 0 && (
                <p style={{ fontSize: 13, color: c.gray[500], maxWidth: 300 }}>
                  Your imported leads have been tagged as "Imported" and are ready for qualification.
                </p>
              )}
            </div>
          )}
        </div>
        
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${c.gray[800]}`, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {step > 1 && step < 4 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                <ChevronLeft size={18} style={{ marginRight: 4 }} /> Back
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {step < 4 && (
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
            )}
            {step === 2 && (
              <Button 
                variant="gradient"
                onClick={validateAndPreview}
                disabled={!LEAD_FIELDS.filter(f => f.required).every(f => Object.values(fieldMapping).includes(f.id))}>
                Continue
              </Button>
            )}
            {step === 3 && (
              <Button variant="gradient" onClick={executeImport} disabled={importing || validCount === 0}>
                {importing ? 'Importing...' : `Import ${validCount} Lead${validCount !== 1 ? 's' : ''}`}
              </Button>
            )}
            {step === 4 && (
              <Button variant="gradient" onClick={completeImport}>
                {importResults?.imported > 0 ? 'View Leads' : 'Close'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </ModalOverlay>
  );
};

const LeadDetailModal = ({ lead, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [enriching, setEnriching] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [enrichmentData, setEnrichmentData] = useState(lead.enrichmentData || null);
  const [verificationData, setVerificationData] = useState(lead.verificationData || null);
  const [notes, setNotes] = useState(lead.notes || '');
  const [showNoteInput, setShowNoteInput] = useState(false);
  
  // Check which integrations are available
  const hasEnrichmentClearbit = integrationConfig.isConfigured('clearbit');
  const hasEnrichmentApollo = integrationConfig.isConfigured('apollo');
  const hasVerificationZeroBounce = integrationConfig.isConfigured('zerobounce');
  const hasVerificationNeverBounce = integrationConfig.isConfigured('neverbounce');
  const hasCRMHubSpot = integrationConfig.isConfigured('hubspot');
  const hasCRMPipedrive = integrationConfig.isConfigured('pipedrive');
  
  const hasAnyEnrichment = hasEnrichmentClearbit || hasEnrichmentApollo;
  const hasAnyVerification = hasVerificationZeroBounce || hasVerificationNeverBounce;
  const hasAnyCRM = hasCRMHubSpot || hasCRMPipedrive;
  
  const handleEnrich = async () => {
    setEnriching(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      
      const provider = hasEnrichmentClearbit ? 'Clearbit' : hasEnrichmentApollo ? 'Apollo.io' : 'Demo';
      
      const mockEnrichment = {
        company: {
          name: lead.company,
          domain: lead.email.split('@')[1],
          industry: 'Technology',
          subIndustry: 'Software & Services',
          employeeCount: '51-200',
          employeeRange: { min: 51, max: 200 },
          revenue: '$10M-$50M',
          revenueEstimate: 28000000,
          founded: 2015,
          description: `${lead.company} is a growing technology company focused on innovative solutions for enterprise customers.`,
          location: 'San Francisco, CA',
          headquarters: { city: 'San Francisco', state: 'California', country: 'United States' },
          linkedin: `https://linkedin.com/company/${lead.company.toLowerCase().replace(/\s/g, '')}`,
          twitter: `https://twitter.com/${lead.company.toLowerCase().replace(/\s/g, '')}`,
          website: `https://${lead.email.split('@')[1]}`,
          techStack: ['Salesforce', 'HubSpot', 'Slack', 'AWS', 'React', 'Node.js'],
          tags: ['B2B', 'SaaS', 'Enterprise', 'Cloud'],
          funding: {
            totalRaised: 15000000,
            lastRound: 'Series A',
            lastRoundAmount: 12000000,
            lastRoundDate: '2024-03-15',
            investors: ['Sequoia Capital', 'Andreessen Horowitz'],
          },
        },
        contact: {
          directPhone: '+1 (555) 123-4567',
          mobilePhone: '+1 (555) 987-6543',
          linkedin: `https://linkedin.com/in/${lead.name.toLowerCase().replace(/\s/g, '')}`,
          twitter: `@${lead.name.split(' ')[0].toLowerCase()}`,
          department: 'Executive',
          seniority: lead.title?.includes('VP') || lead.title?.includes('Director') || lead.title?.includes('Chief') ? 'Executive' : 'Manager',
          bio: `${lead.name} is a ${lead.title} at ${lead.company} with extensive experience in ${lead.title?.includes('Sales') ? 'sales and business development' : 'their field'}.`,
          skills: ['Leadership', 'Strategy', 'Business Development', 'Team Management'],
          experience: [
            { company: lead.company, title: lead.title, current: true },
            { company: 'Previous Corp', title: 'Senior Manager', current: false },
          ],
        },
        enrichedAt: new Date().toISOString(),
        source: provider,
        confidence: 92,
        dataPoints: 47,
      };
      
      setEnrichmentData(mockEnrichment);
      onUpdate({ ...lead, enriched: true, enrichmentData: mockEnrichment });
    } catch (err) {
      console.error('Enrichment failed:', err);
    }
    setEnriching(false);
  };
  
  const handleVerify = async () => {
    setVerifying(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      
      const provider = hasVerificationZeroBounce ? 'ZeroBounce' : hasVerificationNeverBounce ? 'NeverBounce' : 'Demo';
      const isValid = !lead.email.includes('test') && !lead.email.includes('fake');
      
      const mockVerification = {
        email: lead.email,
        status: isValid ? 'valid' : 'invalid',
        score: isValid ? 95 : 23,
        checks: {
          syntax: true,
          domain: true,
          mx: true,
          smtp: isValid,
          disposable: false,
          roleBased: lead.email.split('@')[0] === 'info' || lead.email.split('@')[0] === 'sales',
          catchAll: false,
          spamTrap: false,
        },
        verifiedAt: new Date().toISOString(),
        source: provider,
        deliverability: isValid ? 'high' : 'low',
        risk: isValid ? 'low' : 'high',
        subStatus: isValid ? 'mailbox_verified' : 'mailbox_not_found',
        freeEmail: lead.email.includes('gmail') || lead.email.includes('yahoo') || lead.email.includes('hotmail'),
        creditsUsed: 1,
      };
      
      setVerificationData(mockVerification);
      onUpdate({ ...lead, emailVerified: isValid, verificationData: mockVerification });
    } catch (err) {
      console.error('Verification failed:', err);
    }
    setVerifying(false);
  };
  
  const handleSyncToCRM = async () => {
    setSyncing(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      const crmName = hasCRMHubSpot ? 'HubSpot' : hasCRMPipedrive ? 'Pipedrive' : 'CRM';
      onUpdate({ ...lead, crmSynced: true, crmSyncedAt: new Date().toISOString(), crmProvider: crmName });
    } catch (err) {
      console.error('CRM sync failed:', err);
    }
    setSyncing(false);
  };
  
  const handleSaveNotes = () => {
    onUpdate({ ...lead, notes });
    setShowNoteInput(false);
  };
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'scoring', label: 'Scoring', icon: Target },
    { id: 'notes', label: 'Notes', icon: FileText },
  ];
  
  const activities = [
    { type: 'email_opened', desc: 'Opened email: "Quick question about your goals"', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { type: 'page_view', desc: 'Visited pricing page (3 min)', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { type: 'email_clicked', desc: 'Clicked link in email', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { type: 'form_submit', desc: 'Downloaded whitepaper', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    { type: 'created', desc: 'Lead created from LinkedIn campaign', date: new Date(lead.createdAt) },
  ];
  
  // Scoring breakdown
  const scoringFactors = [
    { factor: 'Job Title', weight: 20, score: lead.title?.includes('VP') || lead.title?.includes('Director') || lead.title?.includes('Chief') ? 20 : 12, maxScore: 20 },
    { factor: 'Company Size', weight: 15, score: 12, maxScore: 15 },
    { factor: 'Engagement', weight: 25, score: 18, maxScore: 25 },
    { factor: 'Recency', weight: 20, score: 16, maxScore: 20 },
    { factor: 'Fit Score', weight: 20, score: Math.round(lead.score * 0.2), maxScore: 20 },
  ];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', zIndex: 100, overflowY: 'auto' }}>
      <Card onClick={(e) => e.stopPropagation()} padding={0} style={{ width: '100%', maxWidth: 900, marginBottom: 40 }}>
        <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}`, display: 'flex', gap: 16 }}>
          <Avatar name={lead.name} size={64} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: c.gray[100] }}>{lead.name}</h2>
              <StatusBadge status={lead.status} />
              {lead.emailVerified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: r.full, background: c.success.muted, color: c.success.DEFAULT, fontSize: 11, fontWeight: 500 }}>
                  <CheckCircle2 size={12} /> Email Verified
                </span>
              )}
              {lead.enriched && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: r.full, background: c.primary[100], color: c.primary.DEFAULT, fontSize: 11, fontWeight: 500 }}>
                  <Sparkles size={12} /> Enriched
                </span>
              )}
              {lead.crmSynced && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: r.full, background: c.accent.muted, color: c.accent.DEFAULT, fontSize: 11, fontWeight: 500 }}>
                  <RefreshCw size={12} /> Synced to {lead.crmProvider}
                </span>
              )}
            </div>
            <p style={{ fontSize: 15, color: c.gray[400], marginBottom: 8 }}>{lead.title} at {lead.company}</p>
            <div style={{ display: 'flex', gap: 20, fontSize: 13, color: c.gray[500], flexWrap: 'wrap' }}>
              <a href={`mailto:${lead.email}`} style={{ display: 'flex', alignItems: 'center', gap: 5, color: c.primary.DEFAULT, textDecoration: 'none' }}>
                <Mail size={14} /> {lead.email}
              </a>
              {(enrichmentData?.contact?.directPhone || lead.phone) && (
                <a href={`tel:${enrichmentData?.contact?.directPhone || lead.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 5, color: c.primary.DEFAULT, textDecoration: 'none' }}>
                  <Phone size={14} /> {enrichmentData?.contact?.directPhone || lead.phone}
                </a>
              )}
              {enrichmentData?.contact?.linkedin && (
                <a href={enrichmentData.contact.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, color: c.primary.DEFAULT, textDecoration: 'none' }}>
                  <Linkedin size={14} /> LinkedIn
                </a>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <Score value={lead.score} size="lg" />
            <p style={{ fontSize: 13, color: c.gray[500] }}>{fmt.currency(lead.value)}</p>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={20} style={{ color: c.gray[500] }} />
            </button>
          </div>
        </div>
        
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${c.gray[800]}`, display: 'flex', gap: 10, background: c.gray[850], flexWrap: 'wrap', alignItems: 'center' }}>
          <Button size="sm" icon={Mail}>Send Email</Button>
          <Button size="sm" variant="secondary" icon={Phone}>Call</Button>
          <Button size="sm" variant="secondary" icon={Zap}>Add to Sequence</Button>
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Button size="sm" variant={enrichmentData ? 'ghost' : 'secondary'} icon={Sparkles} onClick={handleEnrich} disabled={enriching}>
                {enriching ? 'Enriching...' : enrichmentData ? `Re-enrich` : 'Enrich Data'}
              </Button>
              {!hasAnyEnrichment && !enrichmentData && (
                <span style={{ position: 'absolute', top: -6, right: -6, width: 12, height: 12, background: c.warning.DEFAULT, borderRadius: '50%', border: `2px solid ${c.gray[850]}` }} title="No enrichment service configured" />
              )}
            </div>
            
            <div style={{ position: 'relative' }}>
              <Button size="sm" variant={verificationData?.status === 'valid' ? 'ghost' : 'secondary'} icon={Shield} onClick={handleVerify} disabled={verifying}>
                {verifying ? 'Verifying...' : verificationData ? 'Re-verify' : 'Verify Email'}
              </Button>
              {!hasAnyVerification && !verificationData && (
                <span style={{ position: 'absolute', top: -6, right: -6, width: 12, height: 12, background: c.warning.DEFAULT, borderRadius: '50%', border: `2px solid ${c.gray[850]}` }} title="No verification service configured" />
              )}
            </div>
            
            <div style={{ position: 'relative' }}>
              <Button size="sm" variant={lead.crmSynced ? 'ghost' : 'secondary'} icon={RefreshCw} onClick={handleSyncToCRM} disabled={syncing}>
                {syncing ? 'Syncing...' : lead.crmSynced ? 'Synced' : 'Sync to CRM'}
              </Button>
              {!hasAnyCRM && !lead.crmSynced && (
                <span style={{ position: 'absolute', top: -6, right: -6, width: 12, height: 12, background: c.warning.DEFAULT, borderRadius: '50%', border: `2px solid ${c.gray[850]}` }} title="No CRM configured" />
              )}
            </div>
          </div>
        </div>
        
        {(!hasAnyEnrichment || !hasAnyVerification || !hasAnyCRM) && !enrichmentData && !verificationData && (
          <div style={{ padding: '10px 20px', background: c.warning.muted, borderBottom: `1px solid ${c.gray[800]}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={16} style={{ color: c.warning.DEFAULT }} />
            <p style={{ fontSize: 13, color: c.warning.DEFAULT, flex: 1 }}>
              Configure integrations for real data: 
              {!hasAnyEnrichment && ' Clearbit/Apollo (enrichment)'}
              {!hasAnyVerification && ' ZeroBounce/NeverBounce (verification)'}
              {!hasAnyCRM && ' HubSpot/Pipedrive (CRM sync)'}
            </p>
            <a href="#" onClick={(e) => { e.preventDefault(); onClose(); }} style={{ fontSize: 12, color: c.warning.DEFAULT, textDecoration: 'underline' }}>
              Go to Integrations
            </a>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${c.gray[800]}`, flexShrink: 0, overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
                fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer',
                color: activeTab === tab.id ? c.primary.DEFAULT : c.gray[500],
                background: 'transparent',
                borderBottom: activeTab === tab.id ? `2px solid ${c.primary.DEFAULT}` : '2px solid transparent',
                marginBottom: -1, whiteSpace: 'nowrap',
              }}>
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        
        <div style={{ padding: 20 }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[300], marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <InfoRow icon={Mail} label="Email" value={lead.email} verified={lead.emailVerified} />
                  <InfoRow icon={Phone} label="Phone" value={lead.phone || 'Not available'} />
                  {enrichmentData?.contact?.directPhone && (
                    <InfoRow icon={Phone} label="Direct Phone" value={enrichmentData.contact.directPhone} enriched />
                  )}
                  {enrichmentData?.contact?.mobilePhone && (
                    <InfoRow icon={Phone} label="Mobile" value={enrichmentData.contact.mobilePhone} enriched />
                  )}
                  {enrichmentData?.contact?.linkedin && (
                    <InfoRow icon={Linkedin} label="LinkedIn" value={enrichmentData.contact.linkedin} link enriched />
                  )}
                  {enrichmentData?.contact?.seniority && (
                    <InfoRow icon={Award} label="Seniority" value={enrichmentData.contact.seniority} enriched />
                  )}
                </div>
                
                {enrichmentData?.contact?.bio && (
                  <div style={{ marginTop: 16, padding: 12, background: c.gray[850], borderRadius: r.lg, borderLeft: `3px solid ${c.primary.DEFAULT}` }}>
                    <p style={{ fontSize: 13, color: c.gray[400], lineHeight: 1.6, fontStyle: 'italic' }}>
                      "{enrichmentData.contact.bio}"
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[300], marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lead Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <InfoRow icon={Briefcase} label="Title" value={lead.title} />
                  <InfoRow icon={Building2} label="Company" value={lead.company} />
                  <InfoRow icon={DollarSign} label="Deal Value" value={fmt.currency(lead.value)} />
                  <InfoRow icon={Calendar} label="Created" value={fmt.date(lead.createdAt)} />
                  <InfoRow icon={Globe} label="Source" value={lead.source} />
                  {enrichmentData?.contact?.department && (
                    <InfoRow icon={Users} label="Department" value={enrichmentData.contact.department} enriched />
                  )}
                </div>
              </div>
              
              {verificationData && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[300], marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Shield size={16} /> Email Verification Results
                    <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: r.full, background: verificationData.status === 'valid' ? c.success.muted : c.error.muted, color: verificationData.status === 'valid' ? c.success.DEFAULT : c.error.DEFAULT, fontSize: 11, fontWeight: 500, textTransform: 'none' }}>
                      via {verificationData.source}
                    </span>
                  </h3>
                  <div style={{ padding: 16, background: c.gray[850], borderRadius: r.lg, border: `1px solid ${verificationData.status === 'valid' ? c.success.DEFAULT + '40' : c.error.DEFAULT + '40'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: verificationData.status === 'valid' ? c.success.muted : c.error.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {verificationData.status === 'valid' ? (
                            <CheckCircle2 size={24} style={{ color: c.success.DEFAULT }} />
                          ) : (
                            <AlertCircle size={24} style={{ color: c.error.DEFAULT }} />
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 600, color: verificationData.status === 'valid' ? c.success.DEFAULT : c.error.DEFAULT }}>
                            {verificationData.status === 'valid' ? 'Valid Email Address' : 'Invalid Email Address'}
                          </p>
                          <p style={{ fontSize: 12, color: c.gray[500] }}>
                            Deliverability: {verificationData.deliverability} • Risk: {verificationData.risk}
                            {verificationData.freeEmail && ' • Free email provider'}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 28, fontWeight: 700, color: verificationData.status === 'valid' ? c.success.DEFAULT : c.error.DEFAULT }}>{verificationData.score}</p>
                        <p style={{ fontSize: 11, color: c.gray[500] }}>Confidence Score</p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      {Object.entries(verificationData.checks).map(([check, passed]) => (
                        <div key={check} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 10px', background: c.gray[800], borderRadius: r.md, color: passed ? c.success.DEFAULT : check === 'roleBased' ? c.warning.DEFAULT : c.error.DEFAULT }}>
                          {passed ? <Check size={14} /> : <X size={14} />}
                          <span style={{ textTransform: 'capitalize' }}>{check.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: c.gray[600], marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Verified via {verificationData.source} on {fmt.date(verificationData.verifiedAt)}</span>
                      <span>Credits used: {verificationData.creditsUsed}</span>
                    </p>
                  </div>
                </div>
              )}
              
              {enrichmentData?.contact?.skills && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[300], marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skills & Expertise</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {enrichmentData.contact.skills.map(skill => (
                      <span key={skill} style={{ padding: '6px 12px', background: c.gray[800], borderRadius: r.full, fontSize: 13, color: c.gray[300] }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'company' && (
            <div>
              {enrichmentData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Company Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, background: c.gray[850], borderRadius: r.lg }}>
                    <div style={{ width: 64, height: 64, borderRadius: r.lg, background: c.primary[100], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={32} style={{ color: c.primary.DEFAULT }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 600, color: c.gray[100], marginBottom: 4 }}>{enrichmentData.company.name}</h3>
                      <p style={{ fontSize: 14, color: c.gray[500] }}>{enrichmentData.company.industry} • {enrichmentData.company.subIndustry}</p>
                      <p style={{ fontSize: 13, color: c.gray[500] }}>{enrichmentData.company.location}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 11, color: c.gray[500] }}>Data Confidence</p>
                      <p style={{ fontSize: 24, fontWeight: 600, color: enrichmentData.confidence > 80 ? c.success.DEFAULT : c.warning.DEFAULT }}>{enrichmentData.confidence}%</p>
                      <p style={{ fontSize: 11, color: c.gray[600] }}>{enrichmentData.dataPoints} data points</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    <div style={{ padding: 16, background: c.gray[850], borderRadius: r.lg, textAlign: 'center' }}>
                      <Users size={20} style={{ color: c.primary.DEFAULT, marginBottom: 8 }} />
                      <p style={{ fontSize: 18, fontWeight: 600, color: c.gray[100] }}>{enrichmentData.company.employeeCount}</p>
                      <p style={{ fontSize: 12, color: c.gray[500] }}>Employees</p>
                    </div>
                    <div style={{ padding: 16, background: c.gray[850], borderRadius: r.lg, textAlign: 'center' }}>
                      <DollarSign size={20} style={{ color: c.success.DEFAULT, marginBottom: 8 }} />
                      <p style={{ fontSize: 18, fontWeight: 600, color: c.gray[100] }}>{enrichmentData.company.revenue}</p>
                      <p style={{ fontSize: 12, color: c.gray[500] }}>Revenue</p>
                    </div>
                    <div style={{ padding: 16, background: c.gray[850], borderRadius: r.lg, textAlign: 'center' }}>
                      <Calendar size={20} style={{ color: c.warning.DEFAULT, marginBottom: 8 }} />
                      <p style={{ fontSize: 18, fontWeight: 600, color: c.gray[100] }}>{enrichmentData.company.founded}</p>
                      <p style={{ fontSize: 12, color: c.gray[500] }}>Founded</p>
                    </div>
                    <div style={{ padding: 16, background: c.gray[850], borderRadius: r.lg, textAlign: 'center' }}>
                      <TrendingUp size={20} style={{ color: c.accent.DEFAULT, marginBottom: 8 }} />
                      <p style={{ fontSize: 18, fontWeight: 600, color: c.gray[100] }}>{fmt.currency(enrichmentData.company.funding?.totalRaised || 0)}</p>
                      <p style={{ fontSize: 12, color: c.gray[500] }}>Total Funding</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: c.gray[300], marginBottom: 8 }}>About</h4>
                    <p style={{ fontSize: 14, color: c.gray[400], lineHeight: 1.7 }}>{enrichmentData.company.description}</p>
                  </div>
                  
                  {enrichmentData.company.funding && (
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: c.gray[300], marginBottom: 12 }}>Funding History</h4>
                      <div style={{ padding: 16, background: c.gray[850], borderRadius: r.lg }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div>
                            <p style={{ fontSize: 15, fontWeight: 500, color: c.gray[100] }}>{enrichmentData.company.funding.lastRound}</p>
                            <p style={{ fontSize: 12, color: c.gray[500] }}>{fmt.date(enrichmentData.company.funding.lastRoundDate)}</p>
                          </div>
                          <p style={{ fontSize: 18, fontWeight: 600, color: c.success.DEFAULT }}>{fmt.currency(enrichmentData.company.funding.lastRoundAmount)}</p>
                        </div>
                        {enrichmentData.company.funding.investors && (
                          <div>
                            <p style={{ fontSize: 12, color: c.gray[500], marginBottom: 6 }}>Investors</p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {enrichmentData.company.funding.investors.map(inv => (
                                <span key={inv} style={{ padding: '4px 10px', background: c.gray[800], borderRadius: r.full, fontSize: 12, color: c.gray[300] }}>{inv}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {enrichmentData.company.techStack && (
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: c.gray[300], marginBottom: 10 }}>Tech Stack</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {enrichmentData.company.techStack.map(tech => (
                          <span key={tech} style={{ padding: '6px 12px', background: c.primary[100], borderRadius: r.full, fontSize: 13, color: c.primary.DEFAULT }}>
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {enrichmentData.company.tags && (
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: c.gray[300], marginBottom: 10 }}>Industry Tags</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {enrichmentData.company.tags.map(tag => (
                          <span key={tag} style={{ padding: '6px 12px', background: c.gray[800], borderRadius: r.full, fontSize: 13, color: c.gray[400] }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: 10 }}>
                    {enrichmentData.company.website && (
                      <a href={enrichmentData.company.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: c.gray[850], borderRadius: r.lg, fontSize: 13, color: c.primary.DEFAULT, textDecoration: 'none' }}>
                        <Globe size={16} /> Website
                      </a>
                    )}
                    {enrichmentData.company.linkedin && (
                      <a href={enrichmentData.company.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: c.gray[850], borderRadius: r.lg, fontSize: 13, color: c.primary.DEFAULT, textDecoration: 'none' }}>
                        <Linkedin size={16} /> LinkedIn
                      </a>
                    )}
                    {enrichmentData.company.twitter && (
                      <a href={enrichmentData.company.twitter} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: c.gray[850], borderRadius: r.lg, fontSize: 13, color: c.primary.DEFAULT, textDecoration: 'none' }}>
                        <Globe size={16} /> Twitter
                      </a>
                    )}
                  </div>
                  
                  <p style={{ fontSize: 11, color: c.gray[600] }}>
                    Data enriched via {enrichmentData.source} on {fmt.date(enrichmentData.enrichedAt)}
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 60 }}>
                  <Building2 size={56} style={{ color: c.gray[600], marginBottom: 16 }} />
                  <h3 style={{ fontSize: 18, fontWeight: 500, color: c.gray[300], marginBottom: 8 }}>No Company Data Available</h3>
                  <p style={{ fontSize: 14, color: c.gray[500], marginBottom: 8 }}>
                    Enrich this lead to get detailed company information including:
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24, color: c.gray[500], fontSize: 13 }}>
                    <span>• Employee count</span>
                    <span>• Revenue</span>
                    <span>• Tech stack</span>
                    <span>• Funding</span>
                  </div>
                  <Button icon={Sparkles} onClick={handleEnrich} disabled={enriching}>
                    {enriching ? 'Enriching...' : 'Enrich Lead Data'}
                  </Button>
                  {!hasAnyEnrichment && (
                    <p style={{ fontSize: 12, color: c.warning.DEFAULT, marginTop: 12 }}>
                      <AlertCircle size={12} style={{ display: 'inline', marginRight: 4 }} />
                      No enrichment service configured. Using demo data.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'activity' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {activities.map((activity, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: i < activities.length - 1 ? `1px solid ${c.gray[850]}` : 'none' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: c.gray[850], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {activity.type === 'email_opened' && <Mail size={18} style={{ color: c.primary.DEFAULT }} />}
                      {activity.type === 'email_clicked' && <ExternalLink size={18} style={{ color: c.success.DEFAULT }} />}
                      {activity.type === 'page_view' && <Eye size={18} style={{ color: c.warning.DEFAULT }} />}
                      {activity.type === 'form_submit' && <Download size={18} style={{ color: c.accent.DEFAULT }} />}
                      {activity.type === 'created' && <Plus size={18} style={{ color: c.gray[500] }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, color: c.gray[200], marginBottom: 4 }}>{activity.desc}</p>
                      <p style={{ fontSize: 12, color: c.gray[500] }}>{fmt.date(activity.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'scoring' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <Score value={lead.score} size="lg" />
                <div>
                  <p style={{ fontSize: 14, color: c.gray[400] }}>Overall Lead Score</p>
                  <p style={{ fontSize: 12, color: c.gray[500] }}>Based on 5 scoring factors</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {scoringFactors.map(factor => (
                  <div key={factor.factor}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, color: c.gray[300] }}>{factor.factor}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: c.gray[100] }}>{factor.score}/{factor.maxScore}</span>
                    </div>
                    <div style={{ height: 8, background: c.gray[800], borderRadius: r.full, overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${(factor.score / factor.maxScore) * 100}%`, 
                        background: factor.score / factor.maxScore >= 0.7 ? c.success.DEFAULT : factor.score / factor.maxScore >= 0.4 ? c.warning.DEFAULT : c.error.DEFAULT,
                        borderRadius: r.full,
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: 24, padding: 16, background: c.gray[850], borderRadius: r.lg }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: c.gray[300], marginBottom: 8 }}>Score Explanation</h4>
                <p style={{ fontSize: 13, color: c.gray[400], lineHeight: 1.6 }}>
                  This lead scores {lead.score} out of 100 based on their job title seniority, company fit, engagement level with your content, recency of interactions, and overall profile match. 
                  {lead.score >= 75 ? ' This is a high-quality lead worth prioritizing.' : lead.score >= 50 ? ' Consider nurturing this lead with targeted content.' : ' This lead may need more qualification.'}
                </p>
              </div>
            </div>
          )}
          
          {activeTab === 'notes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[300] }}>Notes & Comments</h3>
                {!showNoteInput && (
                  <Button size="sm" variant="secondary" icon={Plus} onClick={() => setShowNoteInput(true)}>Add Note</Button>
                )}
              </div>
              
              {showNoteInput && (
                <div style={{ marginBottom: 20 }}>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this lead..."
                    rows={4}
                    style={{ width: '100%', padding: 12, fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.lg, color: c.gray[100], outline: 'none', resize: 'vertical', marginBottom: 10 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="sm" onClick={handleSaveNotes}>Save Note</Button>
                    <Button size="sm" variant="secondary" onClick={() => setShowNoteInput(false)}>Cancel</Button>
                  </div>
                </div>
              )}
              
              {notes ? (
                <div style={{ padding: 16, background: c.gray[850], borderRadius: r.lg, borderLeft: `3px solid ${c.primary.DEFAULT}` }}>
                  <p style={{ fontSize: 14, color: c.gray[300], lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{notes}</p>
                  <p style={{ fontSize: 11, color: c.gray[600], marginTop: 10 }}>Last updated: {fmt.date(new Date())}</p>
                </div>
              ) : !showNoteInput && (
                <div style={{ padding: 40, textAlign: 'center', background: c.gray[850], borderRadius: r.lg }}>
                  <FileText size={32} style={{ color: c.gray[600], marginBottom: 8 }} />
                  <p style={{ fontSize: 14, color: c.gray[500] }}>No notes yet</p>
                  <p style={{ fontSize: 12, color: c.gray[600], marginTop: 4 }}>Add notes to track important details about this lead</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {(enrichmentData || verificationData) && (
          <div style={{ padding: '10px 20px', background: c.gray[850], borderTop: `1px solid ${c.gray[800]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: c.gray[600] }}>
            <span>
              {enrichmentData && `Enriched via ${enrichmentData.source}`}
              {enrichmentData && verificationData && ' • '}
              {verificationData && `Verified via ${verificationData.source}`}
            </span>
            <span>
              {enrichmentData && `${enrichmentData.dataPoints} data points`}
              {enrichmentData && verificationData && ' • '}
              {verificationData && `Confidence: ${verificationData.score}%`}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value, verified, enriched, link }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <Icon size={16} style={{ color: c.gray[500], flexShrink: 0 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 12, color: c.gray[500], marginBottom: 2 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {link ? (
          <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: c.primary.DEFAULT, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value}
          </a>
        ) : (
          <p style={{ fontSize: 14, color: c.gray[200], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
        )}
        {verified && <CheckCircle2 size={14} style={{ color: c.success.DEFAULT, flexShrink: 0 }} />}
        {enriched && <span style={{ fontSize: 10, padding: '1px 6px', background: c.primary[100], color: c.primary.DEFAULT, borderRadius: r.full }}>Enriched</span>}
      </div>
    </div>
  </div>
);

const ExportModal = ({ isOpen, onClose, data }) => {
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  
  const formats = [
    { id: 'csv', name: 'CSV', desc: 'Universal spreadsheet format', icon: FileText },
    { id: 'json', name: 'JSON', desc: 'For developers & APIs', icon: FileJson },
  ];
  
  const handleExport = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    
    let blob, ext;
    if (format === 'csv') {
      const headers = ['Name', 'Email', 'Company', 'Title', 'Status', 'Score', 'Value', 'Source'];
      const rows = data.map(l => [l.name, l.email, l.company, l.title, l.status, l.score, l.value, l.source]);
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      blob = new Blob([csv], { type: 'text/csv' });
      ext = 'csv';
    } else {
      blob = new Blob([JSON.stringify({ exportDate: new Date().toISOString(), leads: data }, null, 2)], { type: 'application/json' });
      ext = 'json';
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    
    setLoading(false);
    setTimeout(onClose, 200);
  };
  
  if (!isOpen) return null;
  
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 }}>
      <Card onClick={(e) => e.stopPropagation()} padding={24} style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100] }}>Export Leads</h2>
            <p style={{ fontSize: 13, color: c.gray[500], marginTop: 2 }}>{data.length} records</p>
          </div>
          <button onClick={onClose} style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: c.gray[500] }}><X size={20} /></button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {formats.map(f => {
            const Icon = f.icon;
            const selected = format === f.id;
            return (
              <button key={f.id} onClick={() => setFormat(f.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 14,
                  background: selected ? c.primary[100] : c.gray[850],
                  border: `1px solid ${selected ? c.primary.DEFAULT : c.gray[800]}`,
                  borderRadius: r.lg, cursor: 'pointer', textAlign: 'left', transition: tokens.transition.fast,
                }}>
                <Icon size={20} style={{ color: selected ? c.primary.DEFAULT : c.gray[500] }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[100] }}>{f.name}</p>
                  <p style={{ fontSize: 12, color: c.gray[500] }}>{f.desc}</p>
                </div>
                {selected && <Check size={18} style={{ color: c.primary.DEFAULT }} />}
              </button>
            );
          })}
        </div>
        
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button fullWidth loading={loading} onClick={handleExport}>Export</Button>
        </div>
      </Card>
    </div>
  );
};

import LeadAI, { callClaudeAPI, calculateLeadScore, predictConversion, forecastPipeline, identifyAtRiskLeads, recommendNextAction } from './services/leadAI';

const renderMarkdown = (text) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements = [];
  let inTable = false;
  let tableRows = [];
  let inCodeBlock = false;
  let codeContent = [];
  
  const processInlineFormatting = (line, idx) => {
    const parts = line.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={`${idx}-${i}`} style={{ color: c.gray[100] }}>{part}</strong> : part);
  };
  
  lines.forEach((line, idx) => {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={idx} style={{ background: c.gray[900], padding: 12, borderRadius: r.md, fontSize: 13, fontFamily: tokens.font.mono, overflowX: 'auto', margin: '8px 0' }}>
            {codeContent.join('\n')}
          </pre>
        );
        codeContent = [];
      }
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) { codeContent.push(line); return; }
    
    if (line.startsWith('## ')) {
      elements.push(<h2 key={idx} style={{ fontSize: 16, fontWeight: 600, color: c.gray[100], margin: '16px 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>{line.slice(3)}</h2>);
      return;
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={idx} style={{ fontSize: 14, fontWeight: 600, color: c.gray[200], margin: '12px 0 6px' }}>{line.slice(4)}</h3>);
      return;
    }
    
    if (line.startsWith('|')) {
      if (!inTable) { inTable = true; tableRows = []; }
      tableRows.push(line);
      return;
    } else if (inTable) {
      const headers = tableRows[0]?.split('|').filter(c => c.trim()).map(c => c.trim());
      const dataRows = tableRows.slice(2).map(r => r.split('|').filter(c => c.trim()).map(c => c.trim()));
      
      elements.push(
        <div key={`table-${idx}`} style={{ overflowX: 'auto', margin: '8px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{headers?.map((h, i) => <th key={i} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${c.gray[700]}`, color: c.gray[300], fontWeight: 600 }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci} style={{ padding: '8px 12px', borderBottom: `1px solid ${c.gray[800]}`, color: c.gray[300] }}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableRows = [];
    }
    
    if (line === '---') {
      elements.push(<hr key={idx} style={{ border: 'none', borderTop: `1px solid ${c.gray[800]}`, margin: '12px 0' }} />);
      return;
    }
    
    if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <div key={idx} style={{ display: 'flex', gap: 8, marginLeft: 8, marginBottom: 4 }}>
          <span style={{ color: c.gray[500] }}>•</span>
          <span style={{ color: c.gray[300], lineHeight: 1.5 }}>{processInlineFormatting(line.slice(2), idx)}</span>
        </div>
      );
      return;
    }
    
    // Numbered lists
    const numMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      elements.push(
        <div key={idx} style={{ display: 'flex', gap: 8, marginLeft: 4, marginBottom: 4 }}>
          <span style={{ color: c.primary.DEFAULT, fontWeight: 600, minWidth: 20 }}>{numMatch[1]}.</span>
          <span style={{ color: c.gray[300], lineHeight: 1.5 }}>{processInlineFormatting(numMatch[2], idx)}</span>
        </div>
      );
      return;
    }
    
    if (!line.trim()) {
      elements.push(<div key={idx} style={{ height: 8 }} />);
      return;
    }
    
    elements.push(<p key={idx} style={{ color: c.gray[300], lineHeight: 1.6, marginBottom: 4 }}>{processInlineFormatting(line, idx)}</p>);
  });
  
  return elements;
};

const AIAssistant = ({ user }) => {
  const leads = MOCK_LEADS_BY_CLIENT[user.id] || [];
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedLead, setSelectedLead] = useState(null);
  const chatRef = useRef(null);
  
  const analytics = useMemo(() => {
    const topLeads = [...leads].sort((a, b) => b.score - a.score).slice(0, 10);
    const atRisk = identifyAtRiskLeads(leads);
    const forecast = forecastPipeline(leads, 30);
    const hotLeads = leads.filter(l => l.status === 'Hot');
    
    return {
      total: leads.length,
      hot: hotLeads.length,
      warm: leads.filter(l => l.status === 'Warm').length,
      cold: leads.filter(l => l.status === 'Cold').length,
      value: leads.reduce((s, l) => s + l.value, 0),
      avgScore: Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) || 0,
      topLeads,
      atRisk,
      forecast,
      hotValue: hotLeads.reduce((s, l) => s + l.value, 0),
    };
  }, [leads]);
  
  useEffect(() => {
    if (messages.length === 0) {
      const atRiskCount = analytics.atRisk.length;
      const urgentActions = analytics.atRisk.filter(l => l.risks?.some(r => r.type === 'urgent')).length;
      
      setMessages([{
        role: 'assistant',
        content: `## Welcome back, ${user.name.split(' ')[0]}

I'm your AI sales assistant with full access to your pipeline of **${analytics.total} leads**.

### Quick Status
- **${analytics.hot} hot leads** ready for closing
- **${atRiskCount > 0 ? `${atRiskCount} leads need attention` : 'Pipeline healthy'}**${urgentActions > 0 ? ` (${urgentActions} urgent)` : ''}
- **$${(analytics.forecast.revenue.expected/1000).toFixed(0)}K** expected revenue (30 days)

### How I Can Help
- **Prioritization** — "Which leads should I focus on?"
- **Outreach** — "Write an email to my top lead"
- **Forecasts** — "Show my pipeline forecast"
- **Call Prep** — "Prepare me for a meeting with [name]"
- **Objections** — "How do I handle pricing objections?"

What would you like to explore?`,
        time: new Date().toISOString(),
      }]);
    }
  }, []);
  
  useEffect(() => {
    if (chatRef.current) {
      setTimeout(() => {
        chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);
  
  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMessage = { role: 'user', content: input.trim(), time: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    try {
      const conversationHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));
      
      const response = await callClaudeAPI(conversationHistory, user, leads);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        time: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('AI response error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an issue. Please try again.',
        time: new Date().toISOString(),
      }]);
    }
    
    setIsProcessing(false);
  };
  
  const quickPrompts = [
    { icon: Target, label: 'Priority leads', query: 'Which leads should I prioritize today?' },
    { icon: Mail, label: 'Draft email', query: 'Write an outreach email to my top lead' },
    { icon: BarChart3, label: 'Forecast', query: 'Show my 30-day pipeline forecast' },
    { icon: AlertCircle, label: 'At-risk', query: 'Which leads are at risk of going cold?' },
    { icon: Phone, label: 'Call script', query: 'Create a call script for my top lead' },
    { icon: MessageSquare, label: 'Objections', query: 'How should I handle pricing objections?' },
  ];
  
  const handleLeadAction = (lead, action) => {
    const queries = {
      email: `Write a personalized outreach email to ${lead.name} at ${lead.company}`,
      call: `Create a call script for my meeting with ${lead.name}, ${lead.title} at ${lead.company}`,
      analyze: `Give me a detailed analysis of ${lead.name} at ${lead.company} including their score breakdown and next best action`,
      linkedin: `Draft a LinkedIn connection request message for ${lead.name} at ${lead.company}`,
    };
    setInput(queries[action]);
    setActiveTab('chat');
  };

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 160px)', minHeight: 500 }}>
      <Card padding={0} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${c.gray[800]}`, background: c.gray[900] }}>
          {[
            { id: 'chat', label: 'Chat', icon: MessageSquare },
            { id: 'insights', label: 'Quick Insights', icon: Lightbulb },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
                fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer',
                color: activeTab === tab.id ? c.gray[100] : c.gray[500],
                background: activeTab === tab.id ? c.gray[850] : 'transparent',
                borderBottom: activeTab === tab.id ? `2px solid ${c.primary.DEFAULT}` : '2px solid transparent',
                transition: tokens.transition.fast,
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        
        {activeTab === 'chat' ? (
          <>
            <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 20 }}>
                  {msg.role === 'assistant' && (
                    <img src="/logo-colored.png" alt="AI" style={{ width: 32, height: 32, marginRight: 12, flexShrink: 0, objectFit: 'contain' }} />
                  )}
                  <div style={{
                    maxWidth: msg.role === 'user' ? '70%' : '85%',
                    padding: msg.role === 'user' ? '10px 16px' : '16px 20px',
                    background: msg.role === 'user' ? c.primary.DEFAULT : c.gray[850],
                    borderRadius: r.xl,
                    borderTopLeftRadius: msg.role === 'assistant' ? r.sm : r.xl,
                    borderTopRightRadius: msg.role === 'user' ? r.sm : r.xl,
                    border: msg.role === 'assistant' ? `1px solid ${c.gray[800]}` : 'none',
                  }}>
                    {msg.role === 'user' ? (
                      <p style={{ fontSize: 14, color: '#fff', lineHeight: 1.5 }}>{msg.content}</p>
                    ) : (
                      <div style={{ fontSize: 14 }}>{renderMarkdown(msg.content)}</div>
                    )}
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div style={{ display: 'flex', marginBottom: 20 }}>
                  <img src="/logo-colored.png" alt="AI" style={{ width: 32, height: 32, marginRight: 12, objectFit: 'contain' }} />
                  <div style={{ padding: '16px 20px', background: c.gray[850], borderRadius: r.xl, borderTopLeftRadius: r.sm, border: `1px solid ${c.gray[800]}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <RefreshCw size={14} style={{ color: c.primary.DEFAULT, animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: 13, color: c.gray[400] }}>Analyzing your pipeline...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${c.gray[800]}`, display: 'flex', gap: 8, flexWrap: 'wrap', background: c.gray[900] }}>
              {quickPrompts.map(p => (
                <button
                  key={p.label}
                  onClick={() => setInput(p.query)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 12px', fontSize: 13, color: c.gray[400],
                    background: c.gray[850], border: `1px solid ${c.gray[800]}`,
                    borderRadius: r.full, cursor: 'pointer', transition: tokens.transition.fast,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gray[700]; e.currentTarget.style.color = c.gray[300]; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.gray[800]; e.currentTarget.style.color = c.gray[400]; }}
                >
                  <p.icon size={14} />
                  {p.label}
                </button>
              ))}
            </div>
            
            <div style={{ padding: 16, borderTop: `1px solid ${c.gray[800]}`, display: 'flex', gap: 12 }}>
              <input
                placeholder="Ask about your leads, request emails, forecasts, strategies..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                style={{
                  flex: 1, padding: '12px 16px', fontSize: 14, color: c.gray[100],
                  background: c.gray[850], border: `1px solid ${c.gray[800]}`,
                  borderRadius: r.lg, outline: 'none', transition: tokens.transition.fast,
                }}
                onFocus={(e) => e.target.style.borderColor = c.primary.DEFAULT}
                onBlur={(e) => e.target.style.borderColor = c.gray[800]}
              />
              <Button onClick={handleSend} disabled={!input.trim() || isProcessing}>
                <Send size={18} />
              </Button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[300], marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={16} style={{ color: c.primary.DEFAULT }} />
                30-Day Forecast
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Conservative', value: analytics.forecast.revenue.conservative, deals: analytics.forecast.deals.conservative },
                  { label: 'Expected', value: analytics.forecast.revenue.expected, deals: analytics.forecast.deals.expected, highlight: true },
                  { label: 'Optimistic', value: analytics.forecast.revenue.optimistic, deals: analytics.forecast.deals.optimistic },
                ].map(f => (
                  <div key={f.label} style={{ padding: 14, background: f.highlight ? c.primary[100] : c.gray[850], borderRadius: r.lg, border: `1px solid ${f.highlight ? c.primary.DEFAULT : c.gray[800]}` }}>
                    <p style={{ fontSize: 11, color: c.gray[500], marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: f.highlight ? c.primary.DEFAULT : c.gray[200] }}>${(f.value/1000).toFixed(0)}K</p>
                    <p style={{ fontSize: 12, color: c.gray[500], marginTop: 2 }}>{f.deals} deals</p>
                  </div>
                ))}
              </div>
            </div>
            
            {analytics.atRisk.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[300], marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} style={{ color: c.error.DEFAULT }} />
                  Leads Needing Attention ({analytics.atRisk.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {analytics.atRisk.slice(0, 4).map(lead => (
                    <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: c.gray[850], borderRadius: r.lg, border: `1px solid ${c.gray[800]}` }}>
                      <Avatar name={lead.name} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[200] }}>{lead.name}</p>
                        <p style={{ fontSize: 12, color: c.error.DEFAULT }}>{lead.risks[0]?.message}</p>
                      </div>
                      <button
                        onClick={() => handleLeadAction(lead, 'email')}
                        style={{ padding: '6px 12px', fontSize: 12, background: c.primary[100], border: `1px solid ${c.primary.DEFAULT}`, borderRadius: r.md, color: c.primary.DEFAULT, cursor: 'pointer' }}
                      >
                        Draft Email
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[300], marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={16} style={{ color: c.success.DEFAULT }} />
                Top Priority Leads
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {analytics.topLeads.slice(0, 5).map((lead, i) => {
                  const prediction = predictConversion(lead);
                  const action = recommendNextAction(lead, leads);
                  return (
                    <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: c.gray[850], borderRadius: r.lg, border: `1px solid ${c.gray[800]}` }}>
                      <span style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, borderRadius: r.sm, color: i < 3 ? c.primary.DEFAULT : c.gray[500], background: i < 3 ? c.primary[100] : 'transparent' }}>{i + 1}</span>
                      <Avatar name={lead.name} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[200] }}>{lead.name}</p>
                          <StatusBadge status={lead.status} />
                        </div>
                        <p style={{ fontSize: 12, color: c.gray[500] }}>{lead.company} • {prediction.probability}% conversion</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: c.gray[200] }}>${(lead.value/1000).toFixed(0)}K</p>
                        <p style={{ fontSize: 11, color: c.gray[500] }}>Score: {lead.score}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleLeadAction(lead, 'email')} title="Draft Email" style={{ padding: 6, background: c.gray[800], border: 'none', borderRadius: r.sm, cursor: 'pointer', color: c.gray[400], transition: tokens.transition.fast }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = c.primary[100]; e.currentTarget.style.color = c.primary.DEFAULT; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = c.gray[800]; e.currentTarget.style.color = c.gray[400]; }}>
                          <Mail size={14} />
                        </button>
                        <button onClick={() => handleLeadAction(lead, 'call')} title="Call Script" style={{ padding: 6, background: c.gray[800], border: 'none', borderRadius: r.sm, cursor: 'pointer', color: c.gray[400], transition: tokens.transition.fast }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = c.success.muted; e.currentTarget.style.color = c.success.DEFAULT; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = c.gray[800]; e.currentTarget.style.color = c.gray[400]; }}>
                          <Phone size={14} />
                        </button>
                        <button onClick={() => handleLeadAction(lead, 'analyze')} title="Analyze" style={{ padding: 6, background: c.gray[800], border: 'none', borderRadius: r.sm, cursor: 'pointer', color: c.gray[400], transition: tokens.transition.fast }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = c.accent.muted; e.currentTarget.style.color = c.accent.DEFAULT; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = c.gray[800]; e.currentTarget.style.color = c.gray[400]; }}>
                          <Brain size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Card>
      
      <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 16 }} className="ai-sidebar">
        <Card>
          <p style={{ fontSize: 11, fontWeight: 600, color: c.gray[500], textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Pipeline Overview</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Total Leads', value: analytics.total },
              { label: 'Hot Leads', value: analytics.hot, color: c.hot.text },
              { label: 'Warm Leads', value: analytics.warm, color: c.warm.text },
              { label: 'At Risk', value: analytics.atRisk.length, color: analytics.atRisk.length > 0 ? c.error.DEFAULT : c.gray[400] },
              { label: 'Pipeline Value', value: `$${(analytics.value/1000).toFixed(0)}K` },
              { label: 'Avg Score', value: analytics.avgScore },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: c.gray[400] }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: s.color || c.gray[200] }}>{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
        
        <Card>
          <p style={{ fontSize: 11, fontWeight: 600, color: c.gray[500], textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>AI Capabilities</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: Target, label: 'ML Lead Scoring', desc: 'Multi-signal analysis' },
              { icon: TrendingUp, label: 'Conversion Predictions', desc: 'Probability estimates' },
              { icon: Mail, label: 'Email Generation', desc: 'Personalized outreach' },
              { icon: Phone, label: 'Call Scripts', desc: 'Meeting preparation' },
              { icon: BarChart3, label: 'Pipeline Forecasts', desc: 'Revenue projections' },
              { icon: MessageSquare, label: 'Objection Handling', desc: 'Response strategies' },
            ].map(cap => (
              <div key={cap.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: r.md, background: c.gray[850], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <cap.icon size={14} style={{ color: c.primary.DEFAULT }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: c.gray[300] }}>{cap.label}</p>
                  <p style={{ fontSize: 11, color: c.gray[600] }}>{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card style={{ background: `linear-gradient(135deg, ${c.primary[100]}, ${c.accent.muted})`, border: `1px solid ${c.primary.DEFAULT}30` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Lightbulb size={16} style={{ color: c.primary.DEFAULT }} />
            <p style={{ fontSize: 12, fontWeight: 600, color: c.gray[200] }}>Pro Tip</p>
          </div>
          <p style={{ fontSize: 13, color: c.gray[300], lineHeight: 1.5 }}>
            Ask me to "prepare for a meeting with [name]" and I'll create a comprehensive brief with talking points and discovery questions.
          </p>
        </Card>
      </div>
    </div>
  );
};

import { sequenceEngine, SEQUENCE_TEMPLATES, SEQUENCE_STATUS, CHANNEL_TYPES, EMAIL_TEMPLATES } from './services/sequenceService';

const SequencesPage = ({ user }) => {
  const [sequences, setSequences] = useState(sequenceEngine.listSequences());
  const [selectedSequence, setSelectedSequence] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingSequence, setEditingSequence] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollSequenceId, setEnrollSequenceId] = useState(null);
  const [activeTab, setActiveTab] = useState('sequences');
  const [emailConnections, setEmailConnections] = useState([
    { id: 'conn_gmail_demo', providerId: 'gmail', email: 'chris@azimontgroup.com', status: 'connected', dailySent: 45, dailyLimit: 500, connectedAt: new Date(Date.now() - 7 * 86400000).toISOString() }
  ]);
  const [showConnectEmail, setShowConnectEmail] = useState(false);
  const [domains, setDomains] = useState([
    { 
      id: 'dom_1', domain: 'azimontgroup.com', status: 'verified', verifiedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      health: { spf: true, dkim: true, dmarc: true, reputation: 92 },
      dnsRecords: {
        spf: { type: 'TXT', host: '@', value: 'v=spf1 include:_spf.bluestarai.com ~all', status: 'verified' },
        dkim: { type: 'CNAME', host: 'bluestar._domainkey', value: 'dkim.bluestarai.com', status: 'verified' },
        dmarc: { type: 'TXT', host: '_dmarc', value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@azimontgroup.com', status: 'verified' },
        tracking: { type: 'CNAME', host: 'track', value: 'track.bluestarai.com', status: 'verified', required: false },
      }
    }
  ]);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');  
  const [warmups, setWarmups] = useState([
    {
      id: 'warmup_1', connectionId: 'conn_gmail_demo', email: 'chris@azimontgroup.com', schedule: 'moderate', status: 'in_progress',
      currentDay: 8, currentVolume: 50, targetVolume: 150, maxVolume: 150,
      stats: { totalSent: 280, totalReceived: 245, bounces: 2, spamReports: 0, reputation: 78 },
      dailyLogs: Array.from({ length: 7 }, (_, i) => ({ day: i + 1, sent: 10 + i * 5, received: 8 + i * 4, volume: 10 + i * 5 }))
    }
  ]);
  
  const [smsConnections, setSmsConnections] = useState([]);
  const [showConnectSMS, setShowConnectSMS] = useState(false);
  const [smsProvider, setSmsProvider] = useState(null); // 'twilio' or 'messagebird'
  const [smsCredentials, setSmsCredentials] = useState({ accountSid: '', authToken: '', phoneNumber: '', apiKey: '', originator: '' });
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [selectedEmailAccount, setSelectedEmailAccount] = useState(null);
  const [showDomainSetup, setShowDomainSetup] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [showWarmupSettings, setShowWarmupSettings] = useState(false);
  const [selectedWarmup, setSelectedWarmup] = useState(null);
  const refreshSequences = () => setSequences(sequenceEngine.listSequences());
  
  const stats = useMemo(() => {
    const totals = sequences.reduce((acc, seq) => ({
      enrolled: acc.enrolled + seq.stats.enrolled,
      active: acc.active + seq.stats.active,
      completed: acc.completed + seq.stats.completed,
      replied: acc.replied + seq.stats.replied,
    }), { enrolled: 0, active: 0, completed: 0, replied: 0 });
    
    return {
      ...totals,
      replyRate: totals.enrolled > 0 ? Math.round((totals.replied / totals.enrolled) * 100) : 0,
    };
  }, [sequences]);
  
  const channelIcons = { email: Mail, linkedin: Building2, sms: MessageSquare, call: Phone, task: CheckCircle2 };
  const channelColors = { email: '#3b82f6', linkedin: '#0077B5', sms: '#22c55e', call: '#f59e0b', task: '#8b5cf6' };
  
  const tabs = [
    { id: 'sequences', label: 'Sequences', icon: Zap },
    { id: 'email', label: 'Email Accounts', icon: Mail },
    { id: 'domains', label: 'Domains', icon: Globe },
    { id: 'warmup', label: 'Warmup', icon: TrendingUp },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
  ];
  
  const handleCreateFromTemplate = (template) => {
    const newSequence = {
      id: `seq-${Date.now()}`,
      name: template.name,
      description: template.description,
      status: SEQUENCE_STATUS.DRAFT,
      steps: template.steps.map((step, i) => ({
        id: `step-${Date.now()}-${i}`,
        order: i,
        channel: step.channel,
        delayDays: step.day,
        delayHours: 0,
        subject: step.subject || '',
        body: EMAIL_TEMPLATES[step.template]?.body || '',
        template: step.template,
      })),
      settings: {
        sendWindow: { start: 9, end: 17 },
        timezone: 'America/New_York',
        skipWeekends: true,
        stopOnReply: true,
        stopOnMeeting: true,
        dailyLimit: 50,
      },
      stats: { enrolled: 0, active: 0, completed: 0, replied: 0, meetings: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    sequenceEngine.sequences.set(newSequence.id, newSequence);
    refreshSequences();
    setShowCreate(false);
    setEditingSequence(newSequence);
  };
  
  const handleCreateBlank = () => {
    const newSequence = {
      id: `seq-${Date.now()}`,
      name: 'New Sequence',
      description: '',
      status: SEQUENCE_STATUS.DRAFT,
      steps: [],
      settings: {
        sendWindow: { start: 9, end: 17 },
        timezone: 'America/New_York',
        skipWeekends: true,
        stopOnReply: true,
        stopOnMeeting: true,
        dailyLimit: 50,
      },
      stats: { enrolled: 0, active: 0, completed: 0, replied: 0, meetings: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    sequenceEngine.sequences.set(newSequence.id, newSequence);
    refreshSequences();
    setShowCreate(false);
    setEditingSequence(newSequence);
  };
  
  const toggleSequenceStatus = (seq) => {
    const newStatus = seq.status === SEQUENCE_STATUS.ACTIVE ? SEQUENCE_STATUS.PAUSED : SEQUENCE_STATUS.ACTIVE;
    seq.status = newStatus;
    seq.updatedAt = new Date().toISOString();
    refreshSequences();
  };
  
  const deleteSequence = (seqId) => {
    if (confirm('Are you sure you want to delete this sequence?')) {
      sequenceEngine.sequences.delete(seqId);
      refreshSequences();
      setSelectedSequence(null);
    }
  };
  
  const openEnrollModal = (seqId) => {
    setEnrollSequenceId(seqId);
    setShowEnrollModal(true);
  };
  
  const handleConnectEmail = (provider) => {
    const mockConnection = {
      id: `conn_${provider}_${Date.now()}`,
      providerId: provider,
      email: `user@${provider === 'gmail' ? 'gmail.com' : 'outlook.com'}`,
      status: 'connected',
      dailySent: 0,
      dailyLimit: provider === 'gmail' ? 500 : 10000,
      connectedAt: new Date().toISOString(),
    };
    setEmailConnections(prev => [...prev, mockConnection]);
    setShowConnectEmail(false);
  };
  
  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    const domain = {
      id: `dom_${Date.now()}`,
      domain: newDomain.toLowerCase().trim(),
      status: 'pending',
      verifiedAt: null,
      health: { spf: false, dkim: false, dmarc: false, reputation: 0 },
      dnsRecords: {
        spf: { type: 'TXT', host: '@', value: 'v=spf1 include:_spf.bluestarai.com ~all', status: 'pending', required: true },
        dkim: { type: 'CNAME', host: `bluestar${Date.now().toString(36)}._domainkey`, value: 'bluestar._domainkey.bluestarai.com', status: 'pending', required: true },
        dmarc: { type: 'TXT', host: '_dmarc', value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@bluestarai.com', status: 'pending', required: true },
      },
    };
    setDomains(prev => [...prev, domain]);
    setNewDomain('');
    setShowAddDomain(false);
  };
  
  const handleVerifyDomain = (domainId) => {
    setDomains(prev => prev.map(d => {
      if (d.id !== domainId) return d;
      const verified = Math.random() > 0.3;
      const updatedDomain = {
        ...d,
        status: verified ? 'verified' : 'pending',
        verifiedAt: verified ? new Date().toISOString() : null,
        health: verified ? { spf: true, dkim: true, dmarc: true, reputation: Math.floor(Math.random() * 20) + 80 } : d.health,
        dnsRecords: {
          spf: { ...d.dnsRecords.spf, status: verified ? 'verified' : 'failed' },
          dkim: { ...d.dnsRecords.dkim, status: verified ? 'verified' : 'failed' },
          dmarc: { ...d.dnsRecords.dmarc, status: verified ? 'verified' : 'failed' },
          tracking: { ...d.dnsRecords.tracking, status: verified ? 'verified' : 'pending' },
        },
      };
      if (selectedDomain && selectedDomain.id === domainId) {
        setSelectedDomain(updatedDomain);
      }
      return updatedDomain;
    }));
  };
  
  const handleStartWarmup = (connectionId, schedule = 'moderate') => {
    const connection = emailConnections.find(c => c.id === connectionId);
    if (!connection) return;
    
    const warmup = {
      id: `warmup_${Date.now()}`,
      connectionId,
      email: connection.email,
      schedule,
      status: 'in_progress',
      currentDay: 1,
      currentVolume: schedule === 'conservative' ? 5 : schedule === 'aggressive' ? 20 : 10,
      targetVolume: schedule === 'conservative' ? 100 : schedule === 'aggressive' ? 200 : 150,
      maxVolume: schedule === 'conservative' ? 100 : schedule === 'aggressive' ? 200 : 150,
      stats: { totalSent: 0, totalReceived: 0, bounces: 0, spamReports: 0, reputation: 50 },
      dailyLogs: [],
    };
    setWarmups(prev => [...prev, warmup]);
  };
  
  const handleDisconnectEmail = (connectionId) => {
    if (confirm('Are you sure you want to disconnect this email account? This will stop all active sequences using this account.')) {
      setEmailConnections(prev => prev.filter(c => c.id !== connectionId));
      setWarmups(prev => prev.filter(w => w.connectionId !== connectionId));
    }
  };
  
  const handleUpdateEmailSettings = (connectionId, settings) => {
    setEmailConnections(prev => prev.map(c => 
      c.id === connectionId ? { ...c, ...settings } : c
    ));
    setShowEmailSettings(false);
    setSelectedEmailAccount(null);
  };
  
  const handleToggleWarmup = (warmupId) => {
    setWarmups(prev => prev.map(w => {
      if (w.id !== warmupId) return w;
      return { ...w, status: w.status === 'in_progress' ? 'paused' : 'in_progress' };
    }));
  };
  
  const handleUpdateWarmupSettings = (warmupId, settings) => {
    setWarmups(prev => prev.map(w => {
      if (w.id !== warmupId) return w;
      return { ...w, ...settings };
    }));
    setShowWarmupSettings(false);
    setSelectedWarmup(null);
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };
  
  const handleAddDomainWithSetup = () => {
    if (!newDomain.trim()) return;
    const domainName = newDomain.toLowerCase().trim();
    const domain = {
      id: `dom_${Date.now()}`,
      domain: domainName,
      status: 'pending',
      verifiedAt: null,
      health: { spf: false, dkim: false, dmarc: false, reputation: 0 },
      dnsRecords: {
        spf: { type: 'TXT', host: '@', value: `v=spf1 include:_spf.bluestarai.com ~all`, status: 'pending', required: true },
        dkim: { type: 'CNAME', host: `bluestar._domainkey`, value: 'dkim.bluestarai.com', status: 'pending', required: true },
        dmarc: { type: 'TXT', host: '_dmarc', value: `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${domainName}`, status: 'pending', required: true },
        tracking: { type: 'CNAME', host: 'track', value: 'track.bluestarai.com', status: 'pending', required: false },
      },
    };
    setDomains(prev => [...prev, domain]);
    setNewDomain('');
    setShowAddDomain(false);
    setSelectedDomain(domain);
    setShowDomainSetup(true);
  };
  
  const handleConnectSMS = (provider) => {
    if (provider === 'twilio') {
      if (!smsCredentials.accountSid || !smsCredentials.authToken || !smsCredentials.phoneNumber) {
        alert('Please fill in all required fields');
        return;
      }
      const connection = {
        id: `sms_twilio_${Date.now()}`,
        providerId: 'Twilio',
        accountSid: smsCredentials.accountSid,
        phoneNumbers: [smsCredentials.phoneNumber],
        status: 'connected',
        connectedAt: new Date().toISOString(),
        messagesSent: 0,
        messagesLimit: 10000,
      };
      setSmsConnections(prev => [...prev, connection]);
    } else if (provider === 'messagebird') {
      if (!smsCredentials.apiKey || !smsCredentials.originator) {
        alert('Please fill in all required fields');
        return;
      }
      const connection = {
        id: `sms_messagebird_${Date.now()}`,
        providerId: 'MessageBird',
        apiKey: smsCredentials.apiKey.slice(-4),
        phoneNumbers: [smsCredentials.originator],
        status: 'connected',
        connectedAt: new Date().toISOString(),
        messagesSent: 0,
        messagesLimit: 50000,
      };
      setSmsConnections(prev => [...prev, connection]);
    }
    setSmsCredentials({ accountSid: '', authToken: '', phoneNumber: '', apiKey: '', originator: '' });
    setSmsProvider(null);
    setShowConnectSMS(false);
  };
  
  const handleDisconnectSMS = (connectionId) => {
    if (confirm('Are you sure you want to disconnect this SMS provider?')) {
      setSmsConnections(prev => prev.filter(c => c.id !== connectionId));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 4, padding: 4, background: c.gray[900], borderRadius: r.lg, width: 'fit-content', border: `1px solid ${c.gray[800]}` }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', fontSize: 14, fontWeight: 500, border: 'none', borderRadius: r.md, cursor: 'pointer',
              color: activeTab === tab.id ? c.gray[100] : c.gray[500],
              background: activeTab === tab.id ? tokens.gradients.brandSubtle : 'transparent',
              borderLeft: activeTab === tab.id ? `2px solid ${c.accent.DEFAULT}` : '2px solid transparent',
              transition: tokens.transition.fast,
            }}>
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>
      
      {activeTab === 'sequences' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <Metric label="Total Enrolled" value={fmt.number(stats.enrolled)} icon={Users} />
            <Metric label="Active" value={fmt.number(stats.active)} icon={Activity} />
            <Metric label="Completed" value={fmt.number(stats.completed)} icon={CheckCircle2} />
            <Metric label="Reply Rate" value={`${stats.replyRate}%`} icon={MessageSquare} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Outreach Sequences</h2>
            <Button icon={Plus} variant="gradient" onClick={() => setShowCreate(true)}>Create Sequence</Button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            {sequences.map(seq => (
              <Card key={seq.id} hover onClick={() => setSelectedSequence(seq)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 4 }}>{seq.name}</h3>
                    <p style={{ fontSize: 13, color: c.gray[500] }}>{seq.steps.length} steps</p>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: r.full, fontSize: 12, fontWeight: 500,
                    background: seq.status === SEQUENCE_STATUS.ACTIVE ? c.success.muted : seq.status === SEQUENCE_STATUS.PAUSED ? c.warning.muted : c.gray[800],
                    color: seq.status === SEQUENCE_STATUS.ACTIVE ? c.success.DEFAULT : seq.status === SEQUENCE_STATUS.PAUSED ? c.warning.DEFAULT : c.gray[400],
                  }}>
                    {seq.status}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {seq.steps.slice(0, 6).map((step, i) => {
                    const Icon = channelIcons[step.channel] || Mail;
                    return (
                      <div key={i} style={{ width: 28, height: 28, borderRadius: r.md, background: channelColors[step.channel] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={14} style={{ color: channelColors[step.channel] }} />
                      </div>
                    );
                  })}
                  {seq.steps.length > 6 && <span style={{ fontSize: 12, color: c.gray[500], alignSelf: 'center' }}>+{seq.steps.length - 6}</span>}
                </div>
                
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { label: 'Enrolled', value: seq.stats.enrolled },
                    { label: 'Active', value: seq.stats.active },
                    { label: 'Replied', value: seq.stats.replied, color: c.success.DEFAULT },
                  ].map(s => (
                    <div key={s.label}>
                      <p style={{ fontSize: 16, fontWeight: 600, color: s.color || c.gray[200] }}>{s.value}</p>
                      <p style={{ fontSize: 11, color: c.gray[500] }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      
      {activeTab === 'email' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Email Accounts</h2>
              <p style={{ fontSize: 13, color: c.gray[500], marginTop: 4 }}>Connect Gmail or Outlook to send sequences</p>
            </div>
            <Button icon={Plus} variant="gradient" onClick={() => setShowConnectEmail(true)}>Connect Account</Button>
          </div>
          
          <Card style={{ background: `linear-gradient(135deg, rgba(242, 76, 3, 0.1) 0%, rgba(49, 72, 185, 0.05) 100%)`, border: `1px solid ${c.accent.DEFAULT}30` }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: r.lg, background: c.accent.DEFAULT + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={20} style={{ color: c.accent.DEFAULT }} />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[100], marginBottom: 4 }}>Protect Your Email Reputation</h3>
                <p style={{ fontSize: 13, color: c.gray[400], lineHeight: 1.5 }}>
                  To avoid spam filters and protect your domain: verify your domain DNS records, complete email warmup before sending at scale, and stay within daily sending limits.
                </p>
              </div>
            </div>
          </Card>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {emailConnections.map(conn => (
              <Card key={conn.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: r.lg, background: conn.providerId === 'gmail' ? '#EA4335' + '20' : '#0078D4' + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={24} style={{ color: conn.providerId === 'gmail' ? '#EA4335' : '#0078D4' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100] }}>{conn.email}</h3>
                      <span style={{ padding: '2px 8px', borderRadius: r.full, fontSize: 11, fontWeight: 500, background: c.success.muted, color: c.success.DEFAULT }}>
                        Connected
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: c.gray[500], marginTop: 2 }}>
                      {conn.providerId === 'gmail' ? 'Google Workspace' : 'Microsoft 365'} • Connected {fmt.date(conn.connectedAt)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: c.gray[200] }}>{conn.dailySent} / {conn.dailyLimit}</p>
                    <p style={{ fontSize: 11, color: c.gray[500] }}>Emails today</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="secondary" size="sm" onClick={() => { setSelectedEmailAccount(conn); setShowEmailSettings(true); }}>Settings</Button>
                    <Button variant="ghost" size="sm" style={{ color: c.error.DEFAULT }} onClick={() => handleDisconnectEmail(conn.id)}>Disconnect</Button>
                  </div>
                </div>
                
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: c.gray[500] }}>Daily sending limit</span>
                    <span style={{ fontSize: 12, color: c.gray[400] }}>{Math.round((conn.dailySent / conn.dailyLimit) * 100)}%</span>
                  </div>
                  <div style={{ height: 6, background: c.gray[800], borderRadius: r.full, overflow: 'hidden' }}>
                    <div style={{ width: `${(conn.dailySent / conn.dailyLimit) * 100}%`, height: '100%', background: tokens.gradients.brand, transition: 'width 300ms ease' }} />
                  </div>
                </div>
              </Card>
            ))}
            
            {emailConnections.length === 0 && (
              <Card style={{ textAlign: 'center', padding: 40 }}>
                <Mail size={40} style={{ color: c.gray[600], margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[300], marginBottom: 4 }}>No email accounts connected</h3>
                <p style={{ fontSize: 13, color: c.gray[500], marginBottom: 16 }}>Connect Gmail or Outlook to start sending sequences</p>
                <Button icon={Plus} onClick={() => setShowConnectEmail(true)}>Connect Account</Button>
              </Card>
            )}
          </div>
        </>
      )}
      
      {activeTab === 'domains' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Domain Verification</h2>
              <p style={{ fontSize: 13, color: c.gray[500], marginTop: 4 }}>Set up SPF, DKIM, and DMARC to improve deliverability</p>
            </div>
            <Button icon={Plus} variant="gradient" onClick={() => setShowAddDomain(true)}>Add Domain</Button>
          </div>
          
          <Card style={{ background: c.primary[50] }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[100], marginBottom: 8 }}>Why Domain Verification Matters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { name: 'SPF', desc: 'Authorizes servers to send on your behalf' },
                { name: 'DKIM', desc: 'Cryptographic signature for authenticity' },
                { name: 'DMARC', desc: 'Policy for handling failed authentication' },
              ].map(record => (
                <div key={record.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle2 size={16} style={{ color: c.primary.DEFAULT, marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[200] }}>{record.name}</p>
                    <p style={{ fontSize: 12, color: c.gray[500] }}>{record.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {domains.map(domain => (
              <Card key={domain.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: r.lg, background: domain.status === 'verified' ? c.success.muted : c.warning.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Globe size={22} style={{ color: domain.status === 'verified' ? c.success.DEFAULT : c.warning.DEFAULT }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100] }}>{domain.domain}</h3>
                      <p style={{ fontSize: 12, color: c.gray[500] }}>
                        {domain.status === 'verified' ? `Verified ${fmt.date(domain.verifiedAt)}` : 'Pending verification'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {domain.status === 'verified' && (
                      <span style={{ padding: '4px 10px', borderRadius: r.full, fontSize: 12, fontWeight: 500, background: c.success.muted, color: c.success.DEFAULT }}>
                        <CheckCircle2 size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        Verified
                      </span>
                    )}
                    {domain.status !== 'verified' && (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => { setSelectedDomain(domain); setShowDomainSetup(true); }}>View DNS Setup</Button>
                        <Button size="sm" onClick={() => handleVerifyDomain(domain.id)}>Verify DNS</Button>
                      </>
                    )}
                  </div>
                </div>
                
                {domain.status === 'verified' && (
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    {[
                      { name: 'SPF', verified: domain.health.spf },
                      { name: 'DKIM', verified: domain.health.dkim },
                      { name: 'DMARC', verified: domain.health.dmarc },
                      { name: 'Reputation', value: domain.health.reputation },
                    ].map(item => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {item.value !== undefined ? (
                          <>
                            <span style={{ fontSize: 14, fontWeight: 600, color: item.value >= 80 ? c.success.DEFAULT : c.warning.DEFAULT }}>{item.value}</span>
                            <span style={{ fontSize: 12, color: c.gray[500] }}>{item.name}</span>
                          </>
                        ) : (
                          <>
                            {item.verified ? <CheckCircle2 size={14} style={{ color: c.success.DEFAULT }} /> : <AlertCircle size={14} style={{ color: c.error.DEFAULT }} />}
                            <span style={{ fontSize: 12, color: item.verified ? c.gray[400] : c.error.DEFAULT }}>{item.name}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div style={{ background: c.gray[850], borderRadius: r.lg, padding: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: c.gray[400], marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>DNS Records</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(domain.dnsRecords).map(([key, record]) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: c.gray[900], borderRadius: r.md }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: c.gray[500], width: 50 }}>{record.type}</span>
                        <span style={{ fontSize: 12, color: c.gray[400], width: 140, fontFamily: tokens.font.mono }}>{record.host}</span>
                        <span style={{ fontSize: 11, color: c.gray[500], flex: 1, fontFamily: tokens.font.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.value}</span>
                        {record.status === 'verified' ? (
                          <CheckCircle2 size={14} style={{ color: c.success.DEFAULT, flexShrink: 0 }} />
                        ) : (
                          <AlertCircle size={14} style={{ color: c.warning.DEFAULT, flexShrink: 0 }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      
      {activeTab === 'warmup' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Email Warmup</h2>
              <p style={{ fontSize: 13, color: c.gray[500], marginTop: 4 }}>Gradually increase sending volume to build reputation</p>
            </div>
          </div>
          
          <Card gradient>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: r.lg, background: tokens.gradients.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUp size={24} style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 6 }}>How Warmup Works</h3>
                <p style={{ fontSize: 13, color: c.gray[400], lineHeight: 1.5 }}>
                  New email accounts have low sender reputation. Warmup gradually increases sending volume while generating positive engagement signals (opens, replies) to build trust with email providers like Gmail and Outlook.
                </p>
                <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
                  {[
                    { label: 'Conservative', desc: '4-6 weeks, safest', volume: '5 → 100/day' },
                    { label: 'Moderate', desc: '2-3 weeks, balanced', volume: '10 → 150/day' },
                    { label: 'Aggressive', desc: '1-2 weeks, faster', volume: '20 → 200/day' },
                  ].map(plan => (
                    <div key={plan.label}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[200] }}>{plan.label}</p>
                      <p style={{ fontSize: 11, color: c.gray[500] }}>{plan.desc}</p>
                      <p style={{ fontSize: 11, color: c.primary.light, marginTop: 2 }}>{plan.volume}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
          
          {warmups.map(warmup => (
            <Card key={warmup.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={warmup.email} size={44} />
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100] }}>{warmup.email}</h3>
                    <p style={{ fontSize: 12, color: c.gray[500] }}>Day {warmup.currentDay} of {warmup.schedule === 'conservative' ? 42 : warmup.schedule === 'aggressive' ? 14 : 21}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ padding: '4px 10px', borderRadius: r.full, fontSize: 12, fontWeight: 500, background: warmup.status === 'in_progress' ? c.success.muted : c.warning.muted, color: warmup.status === 'in_progress' ? c.success.DEFAULT : c.warning.DEFAULT, textTransform: 'capitalize' }}>
                    {warmup.status.replace('_', ' ')}
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => handleToggleWarmup(warmup.id)}>{warmup.status === 'in_progress' ? 'Pause' : 'Resume'}</Button>
                </div>
              </div>
              
              <div style={{ marginBottom: 16, padding: 14, background: c.gray[850], borderRadius: r.lg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: c.gray[300] }}>Daily Target Volume</span>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedWarmup(warmup); setShowWarmupSettings(true); }}>
                    <Settings size={14} style={{ marginRight: 4 }} /> Customize
                  </Button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="range"
                      min={5}
                      max={warmup.maxVolume || 200}
                      value={warmup.targetVolume}
                      onChange={(e) => handleUpdateWarmupSettings(warmup.id, { targetVolume: parseInt(e.target.value) })}
                      style={{ width: '100%', accentColor: c.primary.DEFAULT }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: c.gray[600], marginTop: 2 }}>
                      <span>5/day</span>
                      <span>Recommended: {warmup.schedule === 'conservative' ? 100 : warmup.schedule === 'aggressive' ? 200 : 150}/day</span>
                      <span>{warmup.maxVolume || 200}/day</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 70 }}>
                    <p style={{ fontSize: 20, fontWeight: 600, color: c.primary.light }}>{warmup.targetVolume}</p>
                    <p style={{ fontSize: 10, color: c.gray[500] }}>emails/day</p>
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: c.gray[400] }}>Volume: {warmup.currentVolume} / {warmup.targetVolume} emails/day</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: c.primary.light }}>{Math.round((warmup.currentVolume / warmup.targetVolume) * 100)}%</span>
                </div>
                <div style={{ height: 8, background: c.gray[800], borderRadius: r.full, overflow: 'hidden' }}>
                  <div style={{ width: `${(warmup.currentVolume / warmup.targetVolume) * 100}%`, height: '100%', background: tokens.gradients.brand, transition: 'width 300ms ease' }} />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Sent', value: warmup.stats.totalSent },
                  { label: 'Received', value: warmup.stats.totalReceived },
                  { label: 'Bounces', value: warmup.stats.bounces, color: warmup.stats.bounces > 5 ? c.error.DEFAULT : null },
                  { label: 'Spam', value: warmup.stats.spamReports, color: warmup.stats.spamReports > 0 ? c.error.DEFAULT : null },
                  { label: 'Reputation', value: warmup.stats.reputation, color: warmup.stats.reputation >= 70 ? c.success.DEFAULT : c.warning.DEFAULT },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center', padding: 10, background: c.gray[850], borderRadius: r.md }}>
                    <p style={{ fontSize: 18, fontWeight: 600, color: stat.color || c.gray[200] }}>{stat.value}</p>
                    <p style={{ fontSize: 11, color: c.gray[500] }}>{stat.label}</p>
                  </div>
                ))}
              </div>
              
              <div style={{ background: c.gray[850], borderRadius: r.lg, padding: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: c.gray[400], marginBottom: 10 }}>Daily Activity</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
                  {warmup.dailyLogs.slice(-14).map((log, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ height: `${(log.sent / 60) * 50}px`, background: c.primary.DEFAULT, borderRadius: 2, minHeight: 4 }} title={`Sent: ${log.sent}`} />
                      <div style={{ height: `${(log.received / 60) * 50}px`, background: c.success.DEFAULT, borderRadius: 2, minHeight: 4 }} title={`Received: ${log.received}`} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c.primary.DEFAULT }} />
                    <span style={{ fontSize: 11, color: c.gray[500] }}>Sent</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c.success.DEFAULT }} />
                    <span style={{ fontSize: 11, color: c.gray[500] }}>Received</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {emailConnections.filter(c => !warmups.find(w => w.connectionId === c.id)).length > 0 && (
            <Card style={{ textAlign: 'center', padding: 30 }}>
              <TrendingUp size={32} style={{ color: c.gray[600], margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[300], marginBottom: 4 }}>Start Email Warmup</h3>
              <p style={{ fontSize: 13, color: c.gray[500], marginBottom: 16 }}>Select an account to begin warming up</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {emailConnections.filter(c => !warmups.find(w => w.connectionId === c.id)).map(conn => (
                  <Button key={conn.id} variant="secondary" onClick={() => handleStartWarmup(conn.id)}>
                    {conn.email}
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
      
      {activeTab === 'sms' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>SMS Integration</h2>
              <p style={{ fontSize: 13, color: c.gray[500], marginTop: 4 }}>Connect Twilio or MessageBird to send SMS in sequences</p>
            </div>
            <Button icon={Plus} variant="gradient" onClick={() => setShowConnectSMS(true)}>Connect Provider</Button>
          </div>
          
          {smsConnections.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 50 }}>
              <MessageSquare size={44} style={{ color: c.gray[600], margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, color: c.gray[300], marginBottom: 6 }}>No SMS Provider Connected</h3>
              <p style={{ fontSize: 13, color: c.gray[500], marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
                Connect a SMS provider like Twilio to send text messages as part of your outreach sequences.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <Button onClick={() => { setSmsProvider('twilio'); setShowConnectSMS(true); }}>
                  <span style={{ width: 16, height: 16, borderRadius: 3, background: '#F22F46', marginRight: 8, display: 'inline-block' }} />
                  Connect Twilio
                </Button>
                <Button variant="secondary" onClick={() => { setSmsProvider('messagebird'); setShowConnectSMS(true); }}>
                  Connect MessageBird
                </Button>
              </div>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {smsConnections.map(conn => (
                <Card key={conn.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: r.lg, background: conn.providerId === 'Twilio' ? '#F22F46' + '20' : '#2481D7' + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageSquare size={24} style={{ color: conn.providerId === 'Twilio' ? '#F22F46' : '#2481D7' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100] }}>{conn.providerId}</h3>
                        <span style={{ padding: '2px 8px', borderRadius: r.full, fontSize: 11, fontWeight: 500, background: c.success.muted, color: c.success.DEFAULT }}>Connected</span>
                      </div>
                      <p style={{ fontSize: 13, color: c.gray[500], marginTop: 2 }}>
                        {conn.phoneNumbers?.length || 0} phone number{conn.phoneNumbers?.length !== 1 ? 's' : ''} • Connected {fmt.date(conn.connectedAt)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: c.gray[200] }}>{conn.messagesSent} / {conn.messagesLimit}</p>
                      <p style={{ fontSize: 11, color: c.gray[500] }}>Messages this month</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="secondary" size="sm">Manage</Button>
                      <Button variant="ghost" size="sm" style={{ color: c.error.DEFAULT }} onClick={() => handleDisconnectSMS(conn.id)}>Disconnect</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
      
      {showCreate && (
        <ModalOverlay onClose={() => setShowCreate(false)} maxWidth={520}>
          <Card padding={24}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100], marginBottom: 6, fontFamily: tokens.font.heading }}>Create Sequence</h2>
            <p style={{ fontSize: 13, color: c.gray[500], marginBottom: 20 }}>Choose a template or start from scratch</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {SEQUENCE_TEMPLATES.map(template => (
                <button key={template.id} onClick={() => handleCreateFromTemplate(template)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: c.gray[850], border: `1px solid ${c.gray[800]}`, borderRadius: r.lg, cursor: 'pointer', textAlign: 'left', transition: tokens.transition.fast }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = c.primary.DEFAULT}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = c.gray[800]}>
                  <div style={{ width: 40, height: 40, borderRadius: r.md, background: c.primary[100], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={20} style={{ color: c.primary.DEFAULT }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[100] }}>{template.name}</p>
                    <p style={{ fontSize: 12, color: c.gray[500] }}>{template.description}</p>
                  </div>
                  <span style={{ fontSize: 12, color: c.gray[500] }}>{template.steps.length} steps</span>
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="gradient" style={{ flex: 1 }} icon={Plus} onClick={handleCreateBlank}>Blank Sequence</Button>
            </div>
          </Card>
        </ModalOverlay>
      )}
      
      {showConnectEmail && (
        <ModalOverlay onClose={() => setShowConnectEmail(false)} maxWidth={480}>
          <Card padding={24}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100], marginBottom: 6, fontFamily: tokens.font.heading }}>Connect Email Account</h2>
            <p style={{ fontSize: 13, color: c.gray[500], marginBottom: 20 }}>Choose your email provider to connect</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { id: 'gmail', name: 'Gmail / Google Workspace', color: '#EA4335', limit: '500 emails/day' },
                { id: 'outlook', name: 'Microsoft Outlook / 365', color: '#0078D4', limit: '10,000 emails/day' },
              ].map(provider => (
                <button key={provider.id} onClick={() => handleConnectEmail(provider.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: c.gray[850], border: `1px solid ${c.gray[800]}`, borderRadius: r.lg, cursor: 'pointer', textAlign: 'left', transition: tokens.transition.fast }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = provider.color}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = c.gray[800]}>
                  <div style={{ width: 44, height: 44, borderRadius: r.lg, background: provider.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={22} style={{ color: provider.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[100] }}>{provider.name}</p>
                    <p style={{ fontSize: 12, color: c.gray[500] }}>Limit: {provider.limit}</p>
                  </div>
                  <ChevronRight size={18} style={{ color: c.gray[500] }} />
                </button>
              ))}
            </div>
            
            <div style={{ marginTop: 20, padding: 14, background: c.gray[850], borderRadius: r.lg }}>
              <p style={{ fontSize: 12, color: c.gray[400], lineHeight: 1.5 }}>
                <strong style={{ color: c.gray[300] }}>Note:</strong> We use OAuth for secure authentication. We never store your password and you can revoke access at any time.
              </p>
            </div>
            
            <Button variant="secondary" fullWidth style={{ marginTop: 16 }} onClick={() => setShowConnectEmail(false)}>Cancel</Button>
          </Card>
        </ModalOverlay>
      )}
      
      {showAddDomain && (
        <ModalOverlay onClose={() => setShowAddDomain(false)} maxWidth={480}>
          <Card padding={24}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100], marginBottom: 6, fontFamily: tokens.font.heading }}>Add Domain</h2>
            <p style={{ fontSize: 13, color: c.gray[500], marginBottom: 20 }}>Enter your sending domain to verify DNS records</p>
            
            <Input
              label="Domain"
              placeholder="yourdomain.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
            />
            
            <div style={{ marginTop: 20, padding: 14, background: c.gray[850], borderRadius: r.lg }}>
              <p style={{ fontSize: 12, color: c.gray[400], lineHeight: 1.5 }}>
                After adding, you'll need to add DNS records to your domain registrar (GoDaddy, Cloudflare, Namecheap, etc.) to verify ownership and enable email authentication.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setShowAddDomain(false)}>Cancel</Button>
              <Button variant="gradient" style={{ flex: 1 }} onClick={handleAddDomainWithSetup} disabled={!newDomain.trim()}>Add Domain</Button>
            </div>
          </Card>
        </ModalOverlay>
      )}
      
      {selectedSequence && !editingSequence && (
        <div onClick={() => setSelectedSequence(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24, paddingTop: 40, zIndex: 100, overflowY: 'auto' }}>
          <Card onClick={(e) => e.stopPropagation()} padding={0} style={{ width: '100%', maxWidth: 700 }}>
            <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], marginBottom: 4 }}>{selectedSequence.name}</h2>
                <p style={{ fontSize: 13, color: c.gray[500] }}>{selectedSequence.description || 'No description'}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{
                  padding: '6px 12px', borderRadius: r.full, fontSize: 12, fontWeight: 500,
                  background: selectedSequence.status === SEQUENCE_STATUS.ACTIVE ? c.success.muted : selectedSequence.status === SEQUENCE_STATUS.PAUSED ? c.warning.muted : c.gray[800],
                  color: selectedSequence.status === SEQUENCE_STATUS.ACTIVE ? c.success.DEFAULT : selectedSequence.status === SEQUENCE_STATUS.PAUSED ? c.warning.DEFAULT : c.gray[400],
                }}>
                  {selectedSequence.status}
                </span>
                <button onClick={() => setSelectedSequence(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} style={{ color: c.gray[500] }} />
                </button>
              </div>
            </div>
            
            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: c.gray[800] }}>
              {[
                { label: 'Enrolled', value: selectedSequence.stats.enrolled },
                { label: 'Active', value: selectedSequence.stats.active },
                { label: 'Completed', value: selectedSequence.stats.completed },
                { label: 'Replied', value: selectedSequence.stats.replied },
                { label: 'Meetings', value: selectedSequence.stats.meetings },
              ].map(stat => (
                <div key={stat.label} style={{ padding: 16, background: c.gray[900], textAlign: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 600, color: c.gray[100] }}>{stat.value}</p>
                  <p style={{ fontSize: 11, color: c.gray[500] }}>{stat.label}</p>
                </div>
              ))}
            </div>
            
            {/* Steps */}
            <div style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[300], marginBottom: 16 }}>Sequence Steps</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedSequence.steps.map((step, i) => {
                  const Icon = channelIcons[step.channel] || Mail;
                  return (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      {/* Timeline */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: channelColors[step.channel] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={18} style={{ color: channelColors[step.channel] }} />
                        </div>
                        {i < selectedSequence.steps.length - 1 && (
                          <div style={{ width: 2, height: 40, background: c.gray[800], marginTop: 8 }} />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div style={{ flex: 1, padding: 14, background: c.gray[850], borderRadius: r.lg, border: `1px solid ${c.gray[800]}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: c.gray[200] }}>
                            Step {i + 1}: {step.channel.charAt(0).toUpperCase() + step.channel.slice(1)}
                          </span>
                          <span style={{ fontSize: 12, color: c.gray[500] }}>
                            {step.delayDays === 0 ? 'Immediately' : `Day ${step.delayDays}`}
                          </span>
                        </div>
                        {step.subject && (
                          <p style={{ fontSize: 13, color: c.gray[400], marginBottom: 4 }}>
                            Subject: {step.subject}
                          </p>
                        )}
                        {step.body && (
                          <p style={{ fontSize: 12, color: c.gray[500], lineHeight: 1.5, maxHeight: 60, overflow: 'hidden' }}>
                            {step.body.substring(0, 150)}...
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Actions */}
            <div style={{ padding: 20, borderTop: `1px solid ${c.gray[800]}`, display: 'flex', gap: 10 }}>
              <Button 
                variant={selectedSequence.status === SEQUENCE_STATUS.ACTIVE ? 'secondary' : 'primary'}
                style={{ flex: 1 }}
                onClick={() => { toggleSequenceStatus(selectedSequence); setSelectedSequence({...selectedSequence}); }}
              >
                {selectedSequence.status === SEQUENCE_STATUS.ACTIVE ? 'Pause Sequence' : 'Activate Sequence'}
              </Button>
              <Button variant="secondary" icon={Edit2} onClick={() => { setEditingSequence(selectedSequence); setSelectedSequence(null); }}>
                Edit
              </Button>
              <Button variant="secondary" icon={Users} onClick={() => { openEnrollModal(selectedSequence.id); setSelectedSequence(null); }}>
                Enroll
              </Button>
              <Button variant="ghost" onClick={() => { deleteSequence(selectedSequence.id); }}>
                <Trash2 size={18} style={{ color: c.error.DEFAULT }} />
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Sequence Builder/Editor Modal */}
      {editingSequence && (
        <SequenceBuilder 
          sequence={editingSequence} 
          onSave={(updated) => {
            sequenceEngine.sequences.set(updated.id, updated);
            refreshSequences();
            setEditingSequence(null);
          }}
          onClose={() => setEditingSequence(null)}
          channelIcons={channelIcons}
          channelColors={channelColors}
        />
      )}
      
      {/* Enroll Leads Modal */}
      {showEnrollModal && (
        <EnrollLeadsModal
          sequenceId={enrollSequenceId}
          onClose={() => { setShowEnrollModal(false); setEnrollSequenceId(null); }}
          onEnroll={() => { refreshSequences(); setShowEnrollModal(false); setEnrollSequenceId(null); }}
        />
      )}
      
      {/* Email Account Settings Modal */}
      {showEmailSettings && selectedEmailAccount && (
        <ModalOverlay onClose={() => { setShowEmailSettings(false); setSelectedEmailAccount(null); }} maxWidth={500}>
          <Card padding={0}>
            <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Email Account Settings</h2>
              <button onClick={() => { setShowEmailSettings(false); setSelectedEmailAccount(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} style={{ color: c.gray[500] }} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 14, background: c.gray[850], borderRadius: r.lg }}>
                <div style={{ width: 44, height: 44, borderRadius: r.lg, background: selectedEmailAccount.providerId === 'gmail' ? '#EA4335' + '20' : '#0078D4' + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={22} style={{ color: selectedEmailAccount.providerId === 'gmail' ? '#EA4335' : '#0078D4' }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: c.gray[100] }}>{selectedEmailAccount.email}</p>
                  <p style={{ fontSize: 12, color: c.gray[500] }}>{selectedEmailAccount.providerId === 'gmail' ? 'Google Workspace' : 'Microsoft 365'}</p>
                </div>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 8 }}>Daily Sending Limit</label>
                <input
                  type="number"
                  min={10}
                  max={selectedEmailAccount.providerId === 'gmail' ? 500 : 10000}
                  value={selectedEmailAccount.dailyLimit}
                  onChange={(e) => setSelectedEmailAccount({ ...selectedEmailAccount, dailyLimit: parseInt(e.target.value) || 100 })}
                  style={{ width: '100%', padding: '10px 14px', background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], fontSize: 14 }}
                />
                <p style={{ fontSize: 11, color: c.gray[500], marginTop: 6 }}>
                  Maximum: {selectedEmailAccount.providerId === 'gmail' ? '500' : '10,000'} emails/day. Lower limits help protect your sender reputation.
                </p>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: c.primary.DEFAULT }} />
                  <div>
                    <p style={{ fontSize: 13, color: c.gray[200] }}>Track email opens</p>
                    <p style={{ fontSize: 11, color: c.gray[500] }}>Add invisible pixel to track when recipients open emails</p>
                  </div>
                </label>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: c.primary.DEFAULT }} />
                  <div>
                    <p style={{ fontSize: 13, color: c.gray[200] }}>Track link clicks</p>
                    <p style={{ fontSize: 11, color: c.gray[500] }}>Track when recipients click links in your emails</p>
                  </div>
                </label>
              </div>
              
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="secondary" style={{ flex: 1 }} onClick={() => { setShowEmailSettings(false); setSelectedEmailAccount(null); }}>Cancel</Button>
                <Button variant="gradient" style={{ flex: 1 }} onClick={() => handleUpdateEmailSettings(selectedEmailAccount.id, { dailyLimit: selectedEmailAccount.dailyLimit })}>Save Settings</Button>
              </div>
            </div>
          </Card>
        </ModalOverlay>
      )}
      
      {/* Domain DNS Setup Modal */}
      {showDomainSetup && selectedDomain && (
        <ModalOverlay onClose={() => { setShowDomainSetup(false); setSelectedDomain(null); }} maxWidth={700}>
          <Card padding={0}>
            <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Configure DNS Records</h2>
                <p style={{ fontSize: 13, color: c.gray[500], marginTop: 2 }}>{selectedDomain.domain}</p>
              </div>
              <button onClick={() => { setShowDomainSetup(false); setSelectedDomain(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} style={{ color: c.gray[500] }} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              {/* Instructions */}
              <div style={{ padding: 14, background: c.primary[50], borderRadius: r.lg, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[100], marginBottom: 6 }}>Setup Instructions</h3>
                <ol style={{ fontSize: 13, color: c.gray[400], lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
                  <li>Log into your domain registrar (GoDaddy, Cloudflare, Namecheap, etc.)</li>
                  <li>Navigate to DNS settings for <strong style={{ color: c.gray[200] }}>{selectedDomain.domain}</strong></li>
                  <li>Add each DNS record below exactly as shown</li>
                  <li>Wait 5-10 minutes for DNS propagation</li>
                  <li>Click "Verify Records" to confirm setup</li>
                </ol>
              </div>
              
              {/* DNS Records */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {Object.entries(selectedDomain.dnsRecords).map(([key, record]) => (
                  <div key={key} style={{ background: c.gray[850], borderRadius: r.lg, padding: 16, border: `1px solid ${record.status === 'verified' ? c.success.DEFAULT + '40' : c.gray[800]}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: c.gray[100], textTransform: 'uppercase' }}>{key}</span>
                        {record.required && <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 6px', background: c.error.muted, color: c.error.DEFAULT, borderRadius: r.sm }}>Required</span>}
                      </div>
                      {record.status === 'verified' ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: c.success.DEFAULT }}>
                          <CheckCircle2 size={14} /> Verified
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: c.warning.DEFAULT }}>
                          <Clock size={14} /> Pending
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 8 }}>
                      <div>
                        <p style={{ fontSize: 10, color: c.gray[600], marginBottom: 4, textTransform: 'uppercase' }}>Type</p>
                        <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[200], fontFamily: tokens.font.mono }}>{record.type}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, color: c.gray[600], marginBottom: 4, textTransform: 'uppercase' }}>Host / Name</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <p style={{ fontSize: 13, color: c.gray[300], fontFamily: tokens.font.mono }}>{record.host}</p>
                          <button onClick={() => copyToClipboard(record.host)} style={{ padding: 4, background: c.gray[700], border: 'none', borderRadius: r.sm, cursor: 'pointer' }}>
                            <FileText size={12} style={{ color: c.gray[400] }} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: 12 }}>
                      <p style={{ fontSize: 10, color: c.gray[600], marginBottom: 4, textTransform: 'uppercase' }}>Value / Points To</p>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: c.gray[900], padding: 10, borderRadius: r.md }}>
                        <p style={{ flex: 1, fontSize: 12, color: c.gray[300], fontFamily: tokens.font.mono, wordBreak: 'break-all', lineHeight: 1.5 }}>{record.value}</p>
                        <button onClick={() => copyToClipboard(record.value)} style={{ padding: 6, background: c.gray[700], border: 'none', borderRadius: r.sm, cursor: 'pointer', flexShrink: 0 }}>
                          <FileText size={14} style={{ color: c.gray[400] }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <Button variant="secondary" style={{ flex: 1 }} onClick={() => { setShowDomainSetup(false); setSelectedDomain(null); }}>Done</Button>
                <Button variant="gradient" style={{ flex: 1 }} onClick={() => { handleVerifyDomain(selectedDomain.id); setSelectedDomain(domains.find(d => d.id === selectedDomain.id) || selectedDomain); }}>
                  <RefreshCw size={16} style={{ marginRight: 6 }} /> Verify Records
                </Button>
              </div>
            </div>
          </Card>
        </ModalOverlay>
      )}
      
      {/* Warmup Settings Modal */}
      {showWarmupSettings && selectedWarmup && (
        <ModalOverlay onClose={() => { setShowWarmupSettings(false); setSelectedWarmup(null); }} maxWidth={500}>
          <Card padding={0}>
            <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Warmup Settings</h2>
              <button onClick={() => { setShowWarmupSettings(false); setSelectedWarmup(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} style={{ color: c.gray[500] }} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 14, background: c.gray[850], borderRadius: r.lg }}>
                <Avatar name={selectedWarmup.email} size={44} />
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: c.gray[100] }}>{selectedWarmup.email}</p>
                  <p style={{ fontSize: 12, color: c.gray[500] }}>Day {selectedWarmup.currentDay} • {selectedWarmup.schedule} schedule</p>
                </div>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 8 }}>Target Daily Volume</label>
                <input
                  type="number"
                  min={5}
                  max={selectedWarmup.maxVolume || 200}
                  value={selectedWarmup.targetVolume}
                  onChange={(e) => setSelectedWarmup({ ...selectedWarmup, targetVolume: parseInt(e.target.value) || 50 })}
                  style={{ width: '100%', padding: '10px 14px', background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], fontSize: 14 }}
                />
                <p style={{ fontSize: 11, color: c.gray[500], marginTop: 6 }}>
                  Recommended for {selectedWarmup.schedule} schedule: {selectedWarmup.schedule === 'conservative' ? 100 : selectedWarmup.schedule === 'aggressive' ? 200 : 150} emails/day
                </p>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 8 }}>Warmup Schedule</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['conservative', 'moderate', 'aggressive'].map(schedule => (
                    <button
                      key={schedule}
                      onClick={() => setSelectedWarmup({ 
                        ...selectedWarmup, 
                        schedule,
                        maxVolume: schedule === 'conservative' ? 100 : schedule === 'aggressive' ? 200 : 150,
                        targetVolume: Math.min(selectedWarmup.targetVolume, schedule === 'conservative' ? 100 : schedule === 'aggressive' ? 200 : 150)
                      })}
                      style={{
                        flex: 1, padding: '10px 14px', borderRadius: r.md, border: `1px solid ${selectedWarmup.schedule === schedule ? c.primary.DEFAULT : c.gray[700]}`,
                        background: selectedWarmup.schedule === schedule ? c.primary[100] : c.gray[850], cursor: 'pointer',
                      }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: selectedWarmup.schedule === schedule ? c.primary.DEFAULT : c.gray[300], textTransform: 'capitalize' }}>{schedule}</p>
                      <p style={{ fontSize: 10, color: c.gray[500], marginTop: 2 }}>
                        {schedule === 'conservative' ? '4-6 weeks' : schedule === 'aggressive' ? '1-2 weeks' : '2-3 weeks'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="secondary" style={{ flex: 1 }} onClick={() => { setShowWarmupSettings(false); setSelectedWarmup(null); }}>Cancel</Button>
                <Button variant="gradient" style={{ flex: 1 }} onClick={() => handleUpdateWarmupSettings(selectedWarmup.id, { targetVolume: selectedWarmup.targetVolume, schedule: selectedWarmup.schedule, maxVolume: selectedWarmup.maxVolume })}>Save Settings</Button>
              </div>
            </div>
          </Card>
        </ModalOverlay>
      )}
      
      {/* Connect SMS Provider Modal */}
      {showConnectSMS && (
        <ModalOverlay onClose={() => { setShowConnectSMS(false); setSmsProvider(null); setSmsCredentials({ accountSid: '', authToken: '', phoneNumber: '', apiKey: '', originator: '' }); }} maxWidth={500}>
          <Card padding={0}>
            <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>
                {smsProvider ? `Connect ${smsProvider === 'twilio' ? 'Twilio' : 'MessageBird'}` : 'Connect SMS Provider'}
              </h2>
              <button onClick={() => { setShowConnectSMS(false); setSmsProvider(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} style={{ color: c.gray[500] }} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              {/* Provider Selection */}
              {!smsProvider && (
                <>
                  <p style={{ fontSize: 13, color: c.gray[500], marginBottom: 16 }}>Choose your SMS provider to connect</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button onClick={() => setSmsProvider('twilio')}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: c.gray[850], border: `1px solid ${c.gray[800]}`, borderRadius: r.lg, cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 44, height: 44, borderRadius: r.lg, background: '#F22F46' + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageSquare size={22} style={{ color: '#F22F46' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[100] }}>Twilio</p>
                        <p style={{ fontSize: 12, color: c.gray[500] }}>Industry-leading reliability and global coverage</p>
                      </div>
                      <ChevronRight size={18} style={{ color: c.gray[500] }} />
                    </button>
                    <button onClick={() => setSmsProvider('messagebird')}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: c.gray[850], border: `1px solid ${c.gray[800]}`, borderRadius: r.lg, cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 44, height: 44, borderRadius: r.lg, background: '#2481D7' + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageSquare size={22} style={{ color: '#2481D7' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[100] }}>MessageBird</p>
                        <p style={{ fontSize: 12, color: c.gray[500] }}>European provider with competitive rates</p>
                      </div>
                      <ChevronRight size={18} style={{ color: c.gray[500] }} />
                    </button>
                  </div>
                </>
              )}
              
              {/* Twilio Form */}
              {smsProvider === 'twilio' && (
                <>
                  <div style={{ padding: 14, background: '#F22F46' + '10', borderRadius: r.lg, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: r.md, background: '#F22F46' + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageSquare size={20} style={{ color: '#F22F46' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[100] }}>Twilio</p>
                      <p style={{ fontSize: 11, color: c.gray[500] }}>Find credentials in your Twilio Console</p>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 6 }}>Account SID *</label>
                    <input
                      type="text"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={smsCredentials.accountSid}
                      onChange={(e) => setSmsCredentials({ ...smsCredentials, accountSid: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], fontSize: 14, fontFamily: tokens.font.mono }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 6 }}>Auth Token *</label>
                    <input
                      type="password"
                      placeholder="Your Twilio Auth Token"
                      value={smsCredentials.authToken}
                      onChange={(e) => setSmsCredentials({ ...smsCredentials, authToken: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], fontSize: 14 }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 6 }}>Phone Number *</label>
                    <input
                      type="text"
                      placeholder="+1234567890"
                      value={smsCredentials.phoneNumber}
                      onChange={(e) => setSmsCredentials({ ...smsCredentials, phoneNumber: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], fontSize: 14 }}
                    />
                    <p style={{ fontSize: 11, color: c.gray[500], marginTop: 6 }}>Your Twilio phone number with country code</p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button variant="secondary" style={{ flex: 1 }} onClick={() => setSmsProvider(null)}>Back</Button>
                    <Button variant="gradient" style={{ flex: 1 }} onClick={() => handleConnectSMS('twilio')} disabled={!smsCredentials.accountSid || !smsCredentials.authToken || !smsCredentials.phoneNumber}>Connect Twilio</Button>
                  </div>
                </>
              )}
              
              {/* MessageBird Form */}
              {smsProvider === 'messagebird' && (
                <>
                  <div style={{ padding: 14, background: '#2481D7' + '10', borderRadius: r.lg, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: r.md, background: '#2481D7' + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageSquare size={20} style={{ color: '#2481D7' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[100] }}>MessageBird</p>
                      <p style={{ fontSize: 11, color: c.gray[500] }}>Find your API key in the MessageBird Dashboard</p>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 6 }}>API Key *</label>
                    <input
                      type="password"
                      placeholder="Your MessageBird API Key"
                      value={smsCredentials.apiKey}
                      onChange={(e) => setSmsCredentials({ ...smsCredentials, apiKey: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], fontSize: 14 }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 6 }}>Originator (Sender ID) *</label>
                    <input
                      type="text"
                      placeholder="+1234567890 or YourBrand"
                      value={smsCredentials.originator}
                      onChange={(e) => setSmsCredentials({ ...smsCredentials, originator: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], fontSize: 14 }}
                    />
                    <p style={{ fontSize: 11, color: c.gray[500], marginTop: 6 }}>Phone number or alphanumeric sender ID (max 11 characters)</p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button variant="secondary" style={{ flex: 1 }} onClick={() => setSmsProvider(null)}>Back</Button>
                    <Button variant="gradient" style={{ flex: 1 }} onClick={() => handleConnectSMS('messagebird')} disabled={!smsCredentials.apiKey || !smsCredentials.originator}>Connect MessageBird</Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </ModalOverlay>
      )}
    </div>
  );
};

const CalendarPage = ({ user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // week, month
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [connectedCalendars, setConnectedCalendars] = useState([
    { id: 'google-1', provider: 'google', email: 'chris@azimontgroup.com', name: 'Google Calendar', connected: true, primary: true, color: '#4285F4' },
  ]);
  
  // Mock events data - includes sequence activities, meetings, and follow-ups
  const [events, setEvents] = useState([
    // Sequence activities
    { id: 'seq-1', type: 'sequence', title: 'Email: Sarah Chen - Follow-up', lead: 'Sarah Chen', sequence: 'Enterprise Outreach', step: 2, date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1, 9, 0), duration: 5, color: c.primary.DEFAULT, status: 'scheduled' },
    { id: 'seq-2', type: 'sequence', title: 'Call: Michael Foster - Discovery', lead: 'Michael Foster', sequence: 'High-Value Prospects', step: 3, date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1, 14, 0), duration: 30, color: c.accent.DEFAULT, status: 'scheduled' },
    { id: 'seq-3', type: 'sequence', title: 'LinkedIn: James Wilson', lead: 'James Wilson', sequence: 'Enterprise Outreach', step: 1, date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 2, 10, 0), duration: 5, color: c.primary.DEFAULT, status: 'scheduled' },
    { id: 'seq-4', type: 'sequence', title: 'Email: Emily Davis - Intro', lead: 'Emily Davis', sequence: 'Cold Outreach', step: 1, date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 3, 8, 30), duration: 5, color: '#10B981', status: 'scheduled' },
    
    // Meetings synced from calendar
    { id: 'meet-1', type: 'meeting', title: 'Discovery Call - Vertex Partners', lead: 'Sophia Anderson', date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 10, 0), duration: 45, color: '#8B5CF6', location: 'Zoom', calendar: 'google-1', meetingLink: 'https://zoom.us/j/123456789' },
    { id: 'meet-2', type: 'meeting', title: 'Demo - TechFlow Inc', lead: 'David Kim', date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 2, 15, 0), duration: 60, color: '#8B5CF6', location: 'Google Meet', calendar: 'google-1', meetingLink: 'https://meet.google.com/abc-defg-hij' },
    { id: 'meet-3', type: 'meeting', title: 'Proposal Review - NexGen', lead: 'Rachel Green', date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 4, 11, 0), duration: 30, color: '#8B5CF6', location: 'Microsoft Teams', calendar: 'google-1' },
    
    // Follow-up tasks
    { id: 'task-1', type: 'task', title: 'Send proposal to Stellar Corp', lead: 'Mia Johnson', date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1, 16, 0), duration: 30, color: c.warning.DEFAULT, priority: 'high' },
    { id: 'task-2', type: 'task', title: 'Prepare contract for TechFlow', lead: 'David Kim', date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 3, 14, 0), duration: 60, color: c.warning.DEFAULT, priority: 'medium' },
  ]);
  
  // Calendar navigation
  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };
  
  const navigateWeek = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + (direction * 7));
      return newDate;
    });
  };
  
  const goToToday = () => setCurrentDate(new Date());
  
  // Get days for current month view
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days = [];
    
    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };
  
  // Get week days for week view
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({ date, isCurrentMonth: true });
    }
    return days;
  };
  
  // Get events for a specific day
  const getEventsForDay = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  };
  
  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  
  // Connect calendar handler
  const connectCalendar = async (provider) => {
    // Mock OAuth flow
    await new Promise(r => setTimeout(r, 1000));
    
    const newCalendar = {
      id: `${provider}-${Date.now()}`,
      provider,
      email: provider === 'google' ? 'user@gmail.com' : 'user@outlook.com',
      name: provider === 'google' ? 'Google Calendar' : 'Outlook Calendar',
      connected: true,
      primary: connectedCalendars.length === 0,
      color: provider === 'google' ? '#4285F4' : '#0078D4',
    };
    
    setConnectedCalendars(prev => [...prev, newCalendar]);
    setShowConnectModal(false);
  };
  
  // Disconnect calendar
  const disconnectCalendar = (calendarId) => {
    setConnectedCalendars(prev => prev.filter(c => c.id !== calendarId));
  };
  
  // Event type icons
  const eventTypeIcons = {
    sequence: Zap,
    meeting: Video,
    task: CheckCircle2,
  };
  
  // Stats
  const todayEvents = getEventsForDay(new Date());
  const upcomingMeetings = events.filter(e => e.type === 'meeting' && new Date(e.date) >= new Date()).length;
  const pendingSequenceSteps = events.filter(e => e.type === 'sequence' && e.status === 'scheduled').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: "Today's Events", value: todayEvents.length, icon: CalendarDays, color: c.primary.DEFAULT },
          { label: 'Upcoming Meetings', value: upcomingMeetings, icon: Video, color: '#8B5CF6' },
          { label: 'Sequence Steps', value: pendingSequenceSteps, icon: Zap, color: c.accent.DEFAULT },
          { label: 'Connected Calendars', value: connectedCalendars.length, icon: RefreshCw, color: c.success.DEFAULT },
        ].map(stat => (
          <Card key={stat.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: r.lg, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={24} style={{ color: stat.color }} />
              </div>
              <div>
                <p style={{ fontSize: 24, fontWeight: 700, color: c.gray[100] }}>{stat.value}</p>
                <p style={{ fontSize: 12, color: c.gray[500] }}>{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Calendar Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button variant="secondary" onClick={goToToday}>Today</Button>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => viewMode === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
              style={{ padding: 8, background: c.gray[800], border: 'none', borderRadius: r.md, cursor: 'pointer' }}>
              <ChevronLeft size={18} style={{ color: c.gray[400] }} />
            </button>
            <button onClick={() => viewMode === 'month' ? navigateMonth(1) : navigateWeek(1)}
              style={{ padding: 8, background: c.gray[800], border: 'none', borderRadius: r.md, cursor: 'pointer' }}>
              <ChevronRight size={18} style={{ color: c.gray[400] }} />
            </button>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', background: c.gray[800], borderRadius: r.md, padding: 2 }}>
            {['week', 'month'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                style={{
                  padding: '6px 14px', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: r.sm, cursor: 'pointer',
                  background: viewMode === mode ? c.gray[700] : 'transparent',
                  color: viewMode === mode ? c.gray[100] : c.gray[500],
                }}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          
          <Button variant="secondary" icon={RefreshCw} onClick={() => setShowConnectModal(true)}>
            Connect Calendar
          </Button>
          <Button icon={Plus} onClick={() => setShowEventModal(true)}>New Event</Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{ display: 'flex', gap: 20 }}>
        {/* Calendar Grid */}
        <Card padding={0} style={{ flex: 1 }}>
          {/* Day Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${c.gray[800]}` }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ padding: '12px 8px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: c.gray[500], textTransform: 'uppercase' }}>
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {(viewMode === 'month' ? getMonthDays() : getWeekDays()).map((day, idx) => {
              const dayEvents = getEventsForDay(day.date);
              const today = isToday(day.date);
              
              return (
                <div key={idx} style={{
                  minHeight: viewMode === 'month' ? 100 : 400,
                  padding: 6,
                  borderRight: (idx + 1) % 7 !== 0 ? `1px solid ${c.gray[850]}` : 'none',
                  borderBottom: `1px solid ${c.gray[850]}`,
                  background: today ? c.primary[50] : !day.isCurrentMonth ? c.gray[900] : 'transparent',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: r.full, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
                    background: today ? c.primary.DEFAULT : 'transparent',
                    color: today ? '#fff' : !day.isCurrentMonth ? c.gray[600] : c.gray[300],
                    fontSize: 13, fontWeight: today ? 600 : 400,
                  }}>
                    {day.date.getDate()}
                  </div>
                  
                  {/* Events */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dayEvents.slice(0, viewMode === 'month' ? 3 : 10).map(event => {
                      const Icon = eventTypeIcons[event.type] || Calendar;
                      return (
                        <div key={event.id} onClick={() => setSelectedEvent(event)}
                          style={{
                            padding: '3px 6px', borderRadius: r.sm, fontSize: 11, cursor: 'pointer',
                            background: `${event.color}20`, borderLeft: `2px solid ${event.color}`,
                            color: c.gray[200], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                          <Icon size={10} style={{ color: event.color, flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {formatTime(event.date)} {event.title}
                          </span>
                        </div>
                      );
                    })}
                    {dayEvents.length > (viewMode === 'month' ? 3 : 10) && (
                      <div style={{ fontSize: 10, color: c.gray[500], paddingLeft: 6 }}>
                        +{dayEvents.length - (viewMode === 'month' ? 3 : 10)} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Today's Schedule */}
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[200], marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} style={{ color: c.primary.DEFAULT }} />
              Today's Schedule
            </h3>
            {todayEvents.length === 0 ? (
              <p style={{ fontSize: 13, color: c.gray[500], textAlign: 'center', padding: 20 }}>No events scheduled for today</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todayEvents.map(event => {
                  const Icon = eventTypeIcons[event.type] || Calendar;
                  return (
                    <div key={event.id} onClick={() => setSelectedEvent(event)}
                      style={{ display: 'flex', gap: 10, padding: 10, background: c.gray[850], borderRadius: r.md, cursor: 'pointer', border: `1px solid ${c.gray[800]}` }}>
                      <div style={{ width: 36, height: 36, borderRadius: r.md, background: `${event.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} style={{ color: event.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[200], marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</p>
                        <p style={{ fontSize: 11, color: c.gray[500] }}>{formatTime(event.date)} • {event.duration}min</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
          
          {/* Connected Calendars */}
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[200], marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={16} style={{ color: c.success.DEFAULT }} />
              Connected Calendars
            </h3>
            {connectedCalendars.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <p style={{ fontSize: 13, color: c.gray[500], marginBottom: 12 }}>No calendars connected</p>
                <Button size="sm" onClick={() => setShowConnectModal(true)}>Connect Calendar</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {connectedCalendars.map(cal => (
                  <div key={cal.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: c.gray[850], borderRadius: r.md }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: r.md, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: cal.provider === 'google' ? '#4285F420' : '#0078D420',
                    }}>
                      {cal.provider === 'google' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0078D4">
                          <path d="M11.5 3v8.5H3V3h8.5zm0 9.5V21H3v-8.5h8.5zm1 0H21V21h-8.5v-8.5zm0-1V3H21v8.5h-8.5z"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[200] }}>{cal.name}</p>
                      <p style={{ fontSize: 11, color: c.gray[500], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cal.email}</p>
                    </div>
                    {cal.primary && (
                      <span style={{ padding: '2px 6px', fontSize: 10, fontWeight: 500, background: c.success.muted, color: c.success.DEFAULT, borderRadius: r.sm }}>Primary</span>
                    )}
                    <button onClick={() => disconnectCalendar(cal.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <X size={14} style={{ color: c.gray[500] }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
          
          {/* Event Legend */}
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: c.gray[200], marginBottom: 12 }}>Event Types</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { type: 'Sequence Activity', color: c.primary.DEFAULT, icon: Zap },
                { type: 'Meeting', color: '#8B5CF6', icon: Video },
                { type: 'Task/Follow-up', color: c.warning.DEFAULT, icon: CheckCircle2 },
              ].map(item => (
                <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                  <item.icon size={14} style={{ color: c.gray[500] }} />
                  <span style={{ fontSize: 12, color: c.gray[400] }}>{item.type}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      
      {/* Connect Calendar Modal */}
      {showConnectModal && (
        <ModalOverlay onClose={() => setShowConnectModal(false)} maxWidth={480}>
          <Card padding={0}>
            <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100] }}>Connect Calendar</h2>
              <button onClick={() => setShowConnectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} style={{ color: c.gray[500] }} />
              </button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: c.gray[400], marginBottom: 8 }}>
                Connect your calendar to sync meetings, schedule follow-ups, and coordinate sequence activities.
              </p>
              
              {/* Google Calendar */}
              <button onClick={() => connectCalendar('google')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: c.gray[850],
                  border: `1px solid ${c.gray[800]}`, borderRadius: r.lg, cursor: 'pointer', width: '100%',
                  transition: tokens.transition.fast,
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = c.gray[700]}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = c.gray[800]}>
                <div style={{ width: 40, height: 40, borderRadius: r.md, background: '#4285F420', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[200] }}>Google Calendar</p>
                  <p style={{ fontSize: 12, color: c.gray[500] }}>Connect your Google account</p>
                </div>
                <ChevronRight size={18} style={{ color: c.gray[600] }} />
              </button>
              
              {/* Outlook Calendar */}
              <button onClick={() => connectCalendar('outlook')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: c.gray[850],
                  border: `1px solid ${c.gray[800]}`, borderRadius: r.lg, cursor: 'pointer', width: '100%',
                  transition: tokens.transition.fast,
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = c.gray[700]}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = c.gray[800]}>
                <div style={{ width: 40, height: 40, borderRadius: r.md, background: '#0078D420', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#0078D4">
                    <path d="M11.5 3v8.5H3V3h8.5zm0 9.5V21H3v-8.5h8.5zm1 0H21V21h-8.5v-8.5zm0-1V3H21v8.5h-8.5z"/>
                  </svg>
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[200] }}>Outlook Calendar</p>
                  <p style={{ fontSize: 12, color: c.gray[500] }}>Connect your Microsoft account</p>
                </div>
                <ChevronRight size={18} style={{ color: c.gray[600] }} />
              </button>
              
              <p style={{ fontSize: 11, color: c.gray[600], textAlign: 'center', marginTop: 8 }}>
                We only request read access to your calendar events and the ability to create new events.
              </p>
            </div>
          </Card>
        </ModalOverlay>
      )}
      
      {/* Event Detail Modal */}
      {selectedEvent && (
        <ModalOverlay onClose={() => setSelectedEvent(null)} maxWidth={500}>
          <Card padding={0}>
            <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: r.lg, background: `${selectedEvent.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {React.createElement(eventTypeIcons[selectedEvent.type] || Calendar, { size: 24, style: { color: selectedEvent.color } })}
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], marginBottom: 4 }}>{selectedEvent.title}</h2>
                  <p style={{ fontSize: 13, color: c.gray[400] }}>
                    {selectedEvent.type === 'sequence' ? `Step ${selectedEvent.step} • ${selectedEvent.sequence}` : 
                     selectedEvent.type === 'meeting' ? selectedEvent.location : 
                     `Priority: ${selectedEvent.priority}`}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} style={{ color: c.gray[500] }} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Clock size={18} style={{ color: c.gray[500] }} />
                  <div>
                    <p style={{ fontSize: 14, color: c.gray[200] }}>
                      {new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <p style={{ fontSize: 13, color: c.gray[500] }}>
                      {formatTime(selectedEvent.date)} • {selectedEvent.duration} minutes
                    </p>
                  </div>
                </div>
                
                {selectedEvent.lead && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <User size={18} style={{ color: c.gray[500] }} />
                    <div>
                      <p style={{ fontSize: 14, color: c.gray[200] }}>{selectedEvent.lead}</p>
                      <p style={{ fontSize: 13, color: c.gray[500] }}>Lead</p>
                    </div>
                  </div>
                )}
                
                {selectedEvent.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <MapPin size={18} style={{ color: c.gray[500] }} />
                    <div>
                      <p style={{ fontSize: 14, color: c.gray[200] }}>{selectedEvent.location}</p>
                      {selectedEvent.meetingLink && (
                        <a href={selectedEvent.meetingLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: c.primary.DEFAULT }}>
                          Join Meeting
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                {selectedEvent.type === 'meeting' && (
                  <Button icon={Video} style={{ flex: 1 }}>Join Meeting</Button>
                )}
                {selectedEvent.type === 'sequence' && (
                  <Button icon={Zap} style={{ flex: 1 }}>Execute Step</Button>
                )}
                {selectedEvent.type === 'task' && (
                  <Button icon={CheckCircle2} style={{ flex: 1 }}>Mark Complete</Button>
                )}
                <Button variant="secondary" icon={Edit2}>Edit</Button>
              </div>
            </div>
          </Card>
        </ModalOverlay>
      )}
    </div>
  );
};

const SequenceBuilder = ({ sequence, onSave, onClose, channelIcons, channelColors }) => {
  const [editedSequence, setEditedSequence] = useState(JSON.parse(JSON.stringify(sequence)));
  const [editingStepIndex, setEditingStepIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('steps');
  
  const updateSequence = (updates) => {
    setEditedSequence(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
  };
  
  const addStep = (channel) => {
    const newStep = {
      id: `step-${Date.now()}`,
      order: editedSequence.steps.length,
      channel,
      delayDays: editedSequence.steps.length === 0 ? 0 : 2,
      delayHours: 0,
      subject: channel === 'email' ? '' : undefined,
      body: '',
      template: null,
    };
    updateSequence({ steps: [...editedSequence.steps, newStep] });
    setEditingStepIndex(editedSequence.steps.length);
  };
  
  const updateStep = (index, updates) => {
    const newSteps = [...editedSequence.steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    updateSequence({ steps: newSteps });
  };
  
  const deleteStep = (index) => {
    const newSteps = editedSequence.steps.filter((_, i) => i !== index);
    updateSequence({ steps: newSteps });
    setEditingStepIndex(null);
  };
  
  const moveStep = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= editedSequence.steps.length) return;
    const newSteps = [...editedSequence.steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    updateSequence({ steps: newSteps });
  };
  
  const handleSave = () => {
    onSave(editedSequence);
  };
  
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', zIndex: 100, overflowY: 'auto' }}>
      <Card onClick={(e) => e.stopPropagation()} padding={0} style={{ width: '100%', maxWidth: 900, marginBottom: 40 }}>
        <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="text"
              value={editedSequence.name}
              onChange={(e) => updateSequence({ name: e.target.value })}
              style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], background: 'transparent', border: 'none', outline: 'none', padding: 0 }}
              placeholder="Sequence name"
            />
            <span style={{
              padding: '4px 10px', borderRadius: r.full, fontSize: 11, fontWeight: 500,
              background: c.gray[800], color: c.gray[400],
            }}>
              {editedSequence.status}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Sequence</Button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${c.gray[800]}`, flexShrink: 0 }}>
          {[
            { id: 'steps', label: 'Steps', icon: Zap },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px',
                fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer',
                color: activeTab === tab.id ? c.primary.DEFAULT : c.gray[500],
                background: 'transparent',
                borderBottom: activeTab === tab.id ? `2px solid ${c.primary.DEFAULT}` : '2px solid transparent',
                marginBottom: -1,
              }}>
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', minHeight: 400 }}>
          {activeTab === 'steps' && (
            <>
              <div style={{ width: 340, borderRight: `1px solid ${c.gray[800]}`, padding: 16, overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {editedSequence.steps.map((step, i) => {
                    const Icon = channelIcons[step.channel] || Mail;
                    const isEditing = editingStepIndex === i;
                    
                    return (
                      <div key={step.id} 
                        onClick={() => setEditingStepIndex(i)}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 10, padding: 12,
                          background: isEditing ? c.primary[100] : c.gray[850],
                          border: `1px solid ${isEditing ? c.primary.DEFAULT : c.gray[800]}`,
                          borderRadius: r.lg, cursor: 'pointer',
                          transition: tokens.transition.fast,
                        }}>
                        <div style={{ width: 32, height: 32, borderRadius: r.md, background: channelColors[step.channel] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={16} style={{ color: channelColors[step.channel] }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[200], marginBottom: 2 }}>
                            {step.channel.charAt(0).toUpperCase() + step.channel.slice(1)}
                          </p>
                          <p style={{ fontSize: 11, color: c.gray[500], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {step.delayDays === 0 ? 'Immediately' : `Wait ${step.delayDays} day${step.delayDays > 1 ? 's' : ''}`}
                            {step.subject ? ` • ${step.subject}` : ''}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button onClick={(e) => { e.stopPropagation(); moveStep(i, -1); }} disabled={i === 0}
                            style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', padding: 2, opacity: i === 0 ? 0.3 : 1 }}>
                            <ChevronDown size={14} style={{ color: c.gray[500], transform: 'rotate(180deg)' }} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); moveStep(i, 1); }} disabled={i === editedSequence.steps.length - 1}
                            style={{ background: 'none', border: 'none', cursor: i === editedSequence.steps.length - 1 ? 'default' : 'pointer', padding: 2, opacity: i === editedSequence.steps.length - 1 ? 0.3 : 1 }}>
                            <ChevronDown size={14} style={{ color: c.gray[500] }} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <p style={{ fontSize: 12, color: c.gray[500], marginBottom: 10 }}>Add step:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {Object.entries(channelIcons).map(([channel, Icon]) => (
                    <button key={channel} onClick={() => addStep(channel)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 12, background: c.gray[850], border: `1px solid ${c.gray[800]}`, borderRadius: r.lg, cursor: 'pointer', transition: tokens.transition.fast }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = channelColors[channel]}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = c.gray[800]}>
                      <Icon size={18} style={{ color: channelColors[channel] }} />
                      <span style={{ fontSize: 11, color: c.gray[400] }}>{channel.charAt(0).toUpperCase() + channel.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
                {editingStepIndex !== null && editedSequence.steps[editingStepIndex] ? (
                  <StepEditor
                    step={editedSequence.steps[editingStepIndex]}
                    stepIndex={editingStepIndex}
                    onUpdate={(updates) => updateStep(editingStepIndex, updates)}
                    onDelete={() => deleteStep(editingStepIndex)}
                    channelColors={channelColors}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: c.gray[500] }}>
                    <Zap size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                    <p style={{ fontSize: 14 }}>Select a step to edit</p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>or add a new step from the left panel</p>
                  </div>
                )}
              </div>
            </>
          )}
          
          {activeTab === 'settings' && (
            <div style={{ flex: 1, padding: 20 }}>
              <div style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 8 }}>Description</label>
                  <textarea
                    value={editedSequence.description || ''}
                    onChange={(e) => updateSequence({ description: e.target.value })}
                    placeholder="Describe what this sequence is for..."
                    rows={3}
                    style={{ width: '100%', padding: 12, fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none', resize: 'vertical' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 8 }}>Send Window</label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input type="number" min="0" max="23" value={editedSequence.settings.sendWindow.start}
                      onChange={(e) => updateSequence({ settings: { ...editedSequence.settings, sendWindow: { ...editedSequence.settings.sendWindow, start: parseInt(e.target.value) } } })}
                      style={{ width: 70, padding: '8px 12px', fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none' }}
                    />
                    <span style={{ color: c.gray[500] }}>to</span>
                    <input type="number" min="0" max="23" value={editedSequence.settings.sendWindow.end}
                      onChange={(e) => updateSequence({ settings: { ...editedSequence.settings, sendWindow: { ...editedSequence.settings.sendWindow, end: parseInt(e.target.value) } } })}
                      style={{ width: 70, padding: '8px 12px', fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none' }}
                    />
                    <span style={{ color: c.gray[500], fontSize: 13 }}>(24h format, recipient's timezone)</span>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 12 }}>Daily Sending Limit</label>
                  <input type="number" min="1" max="500" value={editedSequence.settings.dailyLimit}
                    onChange={(e) => updateSequence({ settings: { ...editedSequence.settings, dailyLimit: parseInt(e.target.value) } })}
                    style={{ width: 100, padding: '8px 12px', fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none' }}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { key: 'skipWeekends', label: 'Skip weekends', desc: 'Don\'t send on Saturday or Sunday' },
                    { key: 'stopOnReply', label: 'Stop on reply', desc: 'Pause sequence when lead replies' },
                    { key: 'stopOnMeeting', label: 'Stop on meeting booked', desc: 'Pause when lead books a meeting' },
                  ].map(setting => (
                    <label key={setting.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editedSequence.settings[setting.key]}
                        onChange={(e) => updateSequence({ settings: { ...editedSequence.settings, [setting.key]: e.target.checked } })}
                        style={{ marginTop: 3 }}
                      />
                      <div>
                        <p style={{ fontSize: 14, color: c.gray[200] }}>{setting.label}</p>
                        <p style={{ fontSize: 12, color: c.gray[500] }}>{setting.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

const StepEditor = ({ step, stepIndex, onUpdate, onDelete, channelColors }) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: c.gray[100] }}>
          Step {stepIndex + 1}: {step.channel.charAt(0).toUpperCase() + step.channel.slice(1)}
        </h3>
        <button onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: c.error.muted, border: 'none', borderRadius: r.md, cursor: 'pointer', color: c.error.DEFAULT, fontSize: 13 }}>
          <Trash2 size={14} /> Delete
        </button>
      </div>
      
      {/* Delay */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 8 }}>
          {stepIndex === 0 ? 'When to send' : 'Wait time after previous step'}
        </label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input type="number" min="0" value={step.delayDays}
            onChange={(e) => onUpdate({ delayDays: parseInt(e.target.value) || 0 })}
            style={{ width: 70, padding: '8px 12px', fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none' }}
          />
          <span style={{ color: c.gray[400], fontSize: 13 }}>days</span>
          <input type="number" min="0" max="23" value={step.delayHours || 0}
            onChange={(e) => onUpdate({ delayHours: parseInt(e.target.value) || 0 })}
            style={{ width: 70, padding: '8px 12px', fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none' }}
          />
          <span style={{ color: c.gray[400], fontSize: 13 }}>hours</span>
        </div>
      </div>
      
      {step.channel === 'email' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 8 }}>Subject Line</label>
            <input type="text" value={step.subject || ''}
              onChange={(e) => onUpdate({ subject: e.target.value })}
              placeholder="Enter subject line... Use {first_name}, {company} for personalization"
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 8 }}>Email Body</label>
            <textarea
              value={step.body || ''}
              onChange={(e) => onUpdate({ body: e.target.value })}
              placeholder={`Hi {first_name},\n\nI noticed {company} has been...\n\nBest,\n{sender_name}`}
              rows={12}
              style={{ width: '100%', padding: 12, fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none', resize: 'vertical', fontFamily: tokens.font.sans, lineHeight: 1.6 }}
            />
          </div>
          <p style={{ fontSize: 12, color: c.gray[500], marginTop: 8 }}>
            Available variables: {'{first_name}'}, {'{last_name}'}, {'{company}'}, {'{title}'}, {'{sender_name}'}
          </p>
        </>
      )}
      
      {step.channel === 'linkedin' && (
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 8 }}>LinkedIn Message</label>
          <textarea
            value={step.body || ''}
            onChange={(e) => onUpdate({ body: e.target.value })}
            placeholder="Hi {first_name}, I came across your profile and..."
            rows={6}
            style={{ width: '100%', padding: 12, fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
          />
          <p style={{ fontSize: 12, color: c.gray[500], marginTop: 8 }}>Keep under 300 characters for connection requests</p>
        </div>
      )}
      
      {step.channel === 'sms' && (
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 8 }}>SMS Message</label>
          <textarea
            value={step.body || ''}
            onChange={(e) => onUpdate({ body: e.target.value })}
            placeholder="Hi {first_name}, quick follow up on my email..."
            rows={4}
            style={{ width: '100%', padding: 12, fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
          />
          <p style={{ fontSize: 12, color: c.gray[500], marginTop: 8 }}>
            {(step.body || '').length}/160 characters (1 SMS segment)
          </p>
        </div>
      )}
      
      {step.channel === 'call' && (
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 8 }}>Call Script / Notes</label>
          <textarea
            value={step.body || ''}
            onChange={(e) => onUpdate({ body: e.target.value })}
            placeholder="Opening: Hi {first_name}, this is [Your Name] from [Company]...\n\nKey points:\n- ...\n\nClose:\n- ..."
            rows={10}
            style={{ width: '100%', padding: 12, fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>
      )}
      
      {step.channel === 'task' && (
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 8 }}>Task Description</label>
          <textarea
            value={step.body || ''}
            onChange={(e) => onUpdate({ body: e.target.value })}
            placeholder="Check LinkedIn profile and engage with recent posts..."
            rows={4}
            style={{ width: '100%', padding: 12, fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>
      )}
    </div>
  );
};

// Enroll Leads Modal
const EnrollLeadsModal = ({ sequenceId, onClose, onEnroll }) => {
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get mock leads (in real app, would come from leads service)
  const allLeads = useMemo(() => MOCK_LEADS, []);
  
  const filteredLeads = useMemo(() => {
    return allLeads.filter(lead => 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allLeads, searchTerm]);
  
  const toggleLead = (leadId) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };
  
  const selectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };
  
  const handleEnroll = () => {
    const sequence = sequenceEngine.sequences.get(sequenceId);
    if (sequence) {
      sequence.stats.enrolled += selectedLeads.length;
      sequence.stats.active += selectedLeads.length;
    }
    onEnroll();
  };
  
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 }}>
      <Card onClick={(e) => e.stopPropagation()} padding={0} style={{ width: '100%', maxWidth: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}` }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100], marginBottom: 4 }}>Enroll Leads in Sequence</h2>
          <p style={{ fontSize: 13, color: c.gray[500] }}>Select leads to add to this sequence</p>
        </div>
        
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${c.gray[800]}` }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.gray[500] }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads..."
              style={{ width: '100%', padding: '10px 12px 10px 40px', fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none' }}
            />
          </div>
        </div>
        
        <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
          <div style={{ padding: '12px 0', borderBottom: `1px solid ${c.gray[800]}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0} onChange={selectAll} />
            <span style={{ fontSize: 13, color: c.gray[400] }}>
              {selectedLeads.length > 0 ? `${selectedLeads.length} selected` : 'Select all'}
            </span>
          </div>
          
          {filteredLeads.map(lead => (
            <div key={lead.id} onClick={() => toggleLead(lead.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${c.gray[850]}`, cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedLeads.includes(lead.id)} onChange={() => {}} />
              <Avatar name={lead.name} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[200] }}>{lead.name}</p>
                <p style={{ fontSize: 12, color: c.gray[500], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {lead.title} at {lead.company}
                </p>
              </div>
              <span style={{ padding: '3px 8px', borderRadius: r.full, fontSize: 11, background: c.gray[800], color: c.gray[400] }}>
                {lead.status}
              </span>
            </div>
          ))}
        </div>
        
        <div style={{ padding: 20, borderTop: `1px solid ${c.gray[800]}`, display: 'flex', gap: 10 }}>
          <Button variant="secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</Button>
          <Button style={{ flex: 1 }} onClick={handleEnroll} disabled={selectedLeads.length === 0}>
            Enroll {selectedLeads.length} Lead{selectedLeads.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const IntegrationsPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('crm');
  const [configuredIntegrations, setConfiguredIntegrations] = useState(integrationConfig.getConfiguredIntegrations());
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [formData, setFormData] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);
  
  // Refresh on config changes
  useEffect(() => {
    const unsubscribe = integrationConfig.subscribe(() => {
      setConfiguredIntegrations(integrationConfig.getConfiguredIntegrations());
    });
    return unsubscribe;
  }, []);
  
  const tabs = [
    { id: 'crm', label: 'CRM', icon: Building2, category: 'crm' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, category: 'calendar' },
    { id: 'enrichment', label: 'Enrichment', icon: Target, category: 'enrichment' },
    { id: 'email', label: 'Email', icon: Mail, category: 'email' },
    { id: 'communication', label: 'SMS/Voice', icon: Phone, category: 'communication' },
    { id: 'verification', label: 'Verification', icon: CheckCircle2, category: 'verification' },
  ];
  
  const getIntegrationsForTab = (category) => {
    return Object.values(INTEGRATIONS).filter(i => i.category === category);
  };
  
  const openSetup = (integration) => {
    const existing = integrationConfig.getConfig(integration.id) || {};
    setFormData(existing);
    setSelectedIntegration(integration);
    setTestResult(null);
  };
  
  const closeSetup = () => {
    setSelectedIntegration(null);
    setFormData({});
    setTestResult(null);
  };
  
  const handleSave = async () => {
    if (!selectedIntegration) return;
    integrationConfig.saveConfig(selectedIntegration.id, formData);
    setTestResult({ success: true, message: 'Configuration saved' });
  };
  
  const handleTest = async () => {
    if (!selectedIntegration) return;
    setTesting(true);
    setTestResult(null);
    
    // Save first
    integrationConfig.saveConfig(selectedIntegration.id, formData);
    
    // Then test
    const result = await integrationConfig.testConnection(selectedIntegration.id);
    setTestResult(result);
    setTesting(false);
  };
  
  const handleDisconnect = () => {
    if (!selectedIntegration) return;
    integrationConfig.removeConfig(selectedIntegration.id);
    closeSetup();
  };
  
  const startOAuth = () => {
    if (!selectedIntegration) return;
    const callbackUrl = `${window.location.origin}/oauth/callback`;
    const url = integrationConfig.getOAuthUrl(selectedIntegration.id, callbackUrl);
    if (url) {
      window.open(url, '_blank', 'width=600,height=700');
    }
  };
  
  // Integration Card Component
  const IntegrationCard = ({ integration }) => {
    const isConfigured = configuredIntegrations.includes(integration.id);
    const isConnected = integrationConfig.isConnected(integration.id);
    
    return (
      <Card hover onClick={() => openSetup(integration)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: r.lg, 
            background: integration.color + '20', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <Building2 size={24} style={{ color: integration.color }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 3 }}>
              {integration.name}
            </p>
            <p style={{ fontSize: 12, color: c.gray[500] }}>{integration.description}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            {isConnected ? (
              <span style={{ 
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: r.full, 
                background: c.success.muted, color: c.success.DEFAULT, 
                fontSize: 12, fontWeight: 500 
              }}>
                <Check size={14} /> Connected
              </span>
            ) : isConfigured ? (
              <span style={{ 
                padding: '4px 10px', borderRadius: r.full, 
                background: c.warning.muted, color: c.warning.DEFAULT, 
                fontSize: 12, fontWeight: 500 
              }}>
                Configured
              </span>
            ) : (
              <span style={{ 
                padding: '4px 10px', borderRadius: r.full, 
                background: c.gray[800], color: c.gray[500], 
                fontSize: 12, fontWeight: 500 
              }}>
                Not set up
              </span>
            )}
          </div>
        </div>
      </Card>
    );
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: c.gray[100], marginBottom: 4 }}>Integrations</h1>
          <p style={{ fontSize: 13, color: c.gray[500] }}>
            {configuredIntegrations.length} of {Object.keys(INTEGRATIONS).length} integrations configured
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={Download} onClick={() => setShowEnvModal(true)}>
          Export .env Template
        </Button>
      </div>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: c.gray[900], borderRadius: r.lg, overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
              fontSize: 13, fontWeight: 500, border: 'none', borderRadius: r.md, cursor: 'pointer',
              color: activeTab === tab.id ? c.gray[100] : c.gray[500],
              background: activeTab === tab.id ? c.gray[800] : 'transparent',
              transition: tokens.transition.fast, whiteSpace: 'nowrap',
            }}>
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Integration Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        {getIntegrationsForTab(tabs.find(t => t.id === activeTab)?.category).map(integration => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
      
      {/* Setup Modal */}
      {selectedIntegration && (
        <div onClick={closeSetup} style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', 
          padding: 24, paddingTop: 60, zIndex: 100, overflowY: 'auto'
        }}>
          <Card onClick={(e) => e.stopPropagation()} padding={0} style={{ width: '100%', maxWidth: 560 }}>
            {/* Modal Header */}
            <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}`, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ 
                width: 44, height: 44, borderRadius: r.lg, 
                background: selectedIntegration.color + '20', 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                <Building2 size={22} style={{ color: selectedIntegration.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100] }}>
                  {selectedIntegration.name} Setup
                </h2>
                <p style={{ fontSize: 12, color: c.gray[500] }}>{selectedIntegration.authType === 'oauth2' ? 'OAuth 2.0' : 'API Key'} authentication</p>
              </div>
              <button onClick={closeSetup} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                <X size={20} style={{ color: c.gray[500] }} />
              </button>
            </div>
            
            {/* Setup Steps */}
            <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}` }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: c.gray[300], marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Setup Instructions
              </h3>
              <ol style={{ paddingLeft: 20, margin: 0 }}>
                {selectedIntegration.setupSteps.map((step, i) => (
                  <li key={i} style={{ fontSize: 13, color: c.gray[400], marginBottom: 8, lineHeight: 1.5 }}>
                    {step.replace('{callback_url}', `${window.location.origin}/oauth/callback`)}
                  </li>
                ))}
              </ol>
              <a href={selectedIntegration.docsUrl} target="_blank" rel="noopener noreferrer" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: c.primary.DEFAULT, marginTop: 12, textDecoration: 'none' }}>
                View full documentation <ExternalLink size={14} />
              </a>
            </div>
            
            {/* Configuration Form */}
            <div style={{ padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: c.gray[300], marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Configuration
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {selectedIntegration.requiredFields.map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 6 }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      style={{
                        width: '100%', padding: '10px 12px', fontSize: 14,
                        background: c.gray[850], border: `1px solid ${c.gray[700]}`,
                        borderRadius: r.md, color: c.gray[100], outline: 'none',
                      }}
                    />
                  </div>
                ))}
              </div>
              
              {/* OAuth Button */}
              {selectedIntegration.authType === 'oauth2' && (
                <div style={{ marginTop: 16, padding: 14, background: c.gray[850], borderRadius: r.lg }}>
                  <p style={{ fontSize: 13, color: c.gray[400], marginBottom: 10 }}>
                    After entering credentials above, authorize access:
                  </p>
                  <Button variant="secondary" fullWidth onClick={startOAuth} icon={ExternalLink}>
                    Authorize with {selectedIntegration.name}
                  </Button>
                </div>
              )}
              
              {/* Test Result */}
              {testResult && (
                <div style={{ 
                  marginTop: 16, padding: 12, borderRadius: r.lg,
                  background: testResult.success ? c.success.muted : c.error.muted,
                  border: `1px solid ${testResult.success ? c.success.DEFAULT : c.error.DEFAULT}30`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {testResult.success ? (
                      <CheckCircle2 size={18} style={{ color: c.success.DEFAULT }} />
                    ) : (
                      <AlertCircle size={18} style={{ color: c.error.DEFAULT }} />
                    )}
                    <span style={{ fontSize: 13, color: testResult.success ? c.success.DEFAULT : c.error.DEFAULT }}>
                      {testResult.message || testResult.error}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <Button onClick={handleSave} style={{ flex: 1 }}>Save Configuration</Button>
                <Button variant="secondary" onClick={handleTest} disabled={testing}>
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
              
              {integrationConfig.isConfigured(selectedIntegration.id) && (
                <button 
                  onClick={handleDisconnect}
                  style={{ 
                    width: '100%', marginTop: 12, padding: 10, 
                    background: 'transparent', border: `1px solid ${c.error.DEFAULT}30`,
                    borderRadius: r.md, color: c.error.DEFAULT, fontSize: 13,
                    cursor: 'pointer', transition: tokens.transition.fast,
                  }}
                >
                  Disconnect Integration
                </button>
              )}
            </div>
          </Card>
        </div>
      )}
      
      {/* Env Template Modal */}
      {showEnvModal && (
        <div onClick={() => setShowEnvModal(false)} style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          padding: 24, zIndex: 100 
        }}>
          <Card onClick={(e) => e.stopPropagation()} padding={20} style={{ width: '100%', maxWidth: 600, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100] }}>Environment Variables Template</h2>
              <button onClick={() => setShowEnvModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} style={{ color: c.gray[500] }} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: c.gray[500], marginBottom: 16 }}>
              Copy this template to your .env.local file and fill in your credentials:
            </p>
            <pre style={{ 
              flex: 1, overflow: 'auto', padding: 16, background: c.gray[900], 
              borderRadius: r.lg, fontSize: 12, color: c.gray[300], 
              fontFamily: tokens.font.mono, lineHeight: 1.6,
              whiteSpace: 'pre-wrap', wordBreak: 'break-all'
            }}>
              {generateEnvTemplate()}
            </pre>
            <Button 
              style={{ marginTop: 16 }} 
              fullWidth 
              onClick={() => {
                navigator.clipboard.writeText(generateEnvTemplate());
                setShowEnvModal(false);
              }}
            >
              Copy to Clipboard
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPLIANCE PAGE - Phase 2 - Fully Functional
// ============================================================================
import { complianceService, CONSENT_TYPES, CONTACT_METHODS, REGULATION_TYPES } from './services/complianceService';

const CompliancePage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(complianceService.getStats());
  const [auditLogs, setAuditLogs] = useState(complianceService.getAuditLog({ limit: 50 }));
  
  // DNC State
  const [dncEntries, setDncEntries] = useState([
    { id: 1, phone: '+1 (555) 123-4567', reason: 'Customer request', addedAt: '2025-01-15', addedBy: 'System' },
    { id: 2, phone: '+1 (555) 234-5678', reason: 'Legal complaint', addedAt: '2025-01-10', addedBy: 'Admin' },
    { id: 3, phone: '+1 (555) 345-6789', reason: 'Opt-out via SMS', addedAt: '2025-01-08', addedBy: 'Auto' },
  ]);
  const [showAddDNC, setShowAddDNC] = useState(false);
  const [showImportDNC, setShowImportDNC] = useState(false);
  const [newDNCPhone, setNewDNCPhone] = useState('');
  const [newDNCReason, setNewDNCReason] = useState('Customer request');
  const [dncSearch, setDncSearch] = useState('');
  const [importDNCText, setImportDNCText] = useState('');
  
  // Consent State
  const [consentRecords, setConsentRecords] = useState([
    { id: 1, leadName: 'John Smith', email: 'john@example.com', type: 'express_written', method: 'email', grantedAt: '2025-01-20', expiresAt: '2027-01-20', status: 'active' },
    { id: 2, leadName: 'Sarah Johnson', email: 'sarah@corp.com', type: 'express_oral', method: 'phone', grantedAt: '2025-01-18', expiresAt: '2026-01-18', status: 'active' },
    { id: 3, leadName: 'Mike Davis', email: 'mike@tech.io', type: 'implied', method: 'email', grantedAt: '2025-01-15', expiresAt: '2026-07-15', status: 'active' },
    { id: 4, leadName: 'Lisa Chen', email: 'lisa@startup.co', type: 'express_written', method: 'sms', grantedAt: '2024-12-01', expiresAt: '2025-01-01', status: 'expired' },
  ]);
  const [showAddConsent, setShowAddConsent] = useState(false);
  const [consentSearch, setConsentSearch] = useState('');
  const [showExportConsent, setShowExportConsent] = useState(false);
  const [showExportAudit, setShowExportAudit] = useState(false);
  const [newConsent, setNewConsent] = useState({
    leadName: '',
    email: '',
    type: 'express_written',
    method: 'email',
  });
  
  // Audit State
  const [auditFilter, setAuditFilter] = useState('all');
  
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'dnc', label: 'DNC List' },
    { id: 'consent', label: 'Consent' },
    { id: 'audit', label: 'Audit Log' },
  ];
  
  const handleAddDNC = () => {
    if (newDNCPhone.trim()) {
      const entry = {
        id: Date.now(),
        phone: newDNCPhone,
        reason: newDNCReason,
        addedAt: new Date().toISOString().split('T')[0],
        addedBy: user.name || 'User',
      };
      setDncEntries(prev => [entry, ...prev]);
      setNewDNCPhone('');
      setNewDNCReason('Customer request');
      setShowAddDNC(false);
      setStats(prev => ({ ...prev, dncCount: prev.dncCount + 1 }));
    }
  };
  
  const handleRemoveDNC = (id) => {
    setDncEntries(prev => prev.filter(e => e.id !== id));
    setStats(prev => ({ ...prev, dncCount: Math.max(0, prev.dncCount - 1) }));
  };
  
  const handleRevokeConsent = (id) => {
    setConsentRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'revoked' } : r));
  };
  
  // Import DNC from CSV text
  const handleImportDNC = () => {
    if (importDNCText.trim()) {
      const lines = importDNCText.split('\n').filter(l => l.trim());
      const newEntries = lines.map((line, i) => {
        const parts = line.split(',').map(p => p.trim());
        return {
          id: Date.now() + i,
          phone: parts[0] || line,
          reason: parts[1] || 'Imported',
          addedAt: new Date().toISOString().split('T')[0],
          addedBy: user.name || 'Import',
        };
      });
      setDncEntries(prev => [...newEntries, ...prev]);
      setStats(prev => ({ ...prev, dncCount: prev.dncCount + newEntries.length }));
      setImportDNCText('');
      setShowImportDNC(false);
    }
  };
  
  // Add new consent record
  const handleAddConsent = () => {
    if (newConsent.leadName.trim() && newConsent.email.trim()) {
      const consent = {
        id: Date.now(),
        leadName: newConsent.leadName,
        email: newConsent.email,
        type: newConsent.type,
        method: newConsent.method,
        grantedAt: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
      };
      setConsentRecords(prev => [consent, ...prev]);
      setNewConsent({ leadName: '', email: '', type: 'express_written', method: 'email' });
      setShowAddConsent(false);
    }
  };
  
  // Export consent records as CSV
  const handleExportConsent = () => {
    const headers = ['Lead Name', 'Email', 'Consent Type', 'Method', 'Granted At', 'Expires At', 'Status'];
    const rows = consentRecords.map(r => [r.leadName, r.email, r.type, r.method, r.grantedAt, r.expiresAt, r.status]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consent_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportConsent(false);
  };
  
  // Export audit logs as CSV
  const handleExportAudit = () => {
    const headers = ['ID', 'Timestamp', 'Action', 'User ID', 'Details'];
    const rows = auditLogs.map(l => [l.id, l.timestamp, l.action, l.userId || 'System', JSON.stringify(l.details || {})]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportAudit(false);
  };
  
  const filteredDNC = dncEntries.filter(e => 
    e.phone.includes(dncSearch) || e.reason.toLowerCase().includes(dncSearch.toLowerCase())
  );
  
  const filteredConsent = consentRecords.filter(r =>
    r.leadName.toLowerCase().includes(consentSearch.toLowerCase()) ||
    r.email.toLowerCase().includes(consentSearch.toLowerCase())
  );
  
  const filteredAuditLogs = auditFilter === 'all' 
    ? auditLogs 
    : auditLogs.filter(log => log.action.includes(auditFilter));
  
  const consentTypeColors = {
    express_written: c.success.DEFAULT,
    express_oral: c.primary.DEFAULT,
    implied: c.warning.DEFAULT,
  };
  
  const consentTypeLabels = {
    express_written: 'Express Written',
    express_oral: 'Express Oral',
    implied: 'Implied',
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Compliance Status Banner */}
      <Card style={{ background: `linear-gradient(135deg, ${c.success.muted}, ${c.primary[50]})`, border: `1px solid ${c.success.DEFAULT}30` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: r.lg, background: c.success.DEFAULT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], marginBottom: 4 }}>Compliance Status: Active</h2>
            <p style={{ fontSize: 13, color: c.gray[400] }}>All compliance checks are enabled and monitoring</p>
          </div>
        </div>
      </Card>
      
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        <Metric label="DNC Entries" value={fmt.number(dncEntries.length)} icon={Phone} />
        <Metric label="Suppressions" value={fmt.number(stats.suppressionCount)} icon={Mail} />
        <Metric label="Consent Records" value={fmt.number(consentRecords.length)} icon={CheckCircle2} />
        <Metric label="Audit Entries" value={fmt.number(auditLogs.length)} icon={Eye} />
      </div>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: c.gray[900], borderRadius: r.lg, width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px', fontSize: 14, fontWeight: 500, border: 'none', borderRadius: r.md, cursor: 'pointer',
              color: activeTab === tab.id ? c.gray[100] : c.gray[500],
              background: activeTab === tab.id ? c.gray[800] : 'transparent',
              transition: tokens.transition.fast,
            }}>
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 16 }}>Regulations Covered</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { name: 'TCPA', desc: 'Telephone Consumer Protection Act', status: 'active' },
                { name: 'CAN-SPAM', desc: 'Email marketing compliance', status: 'active' },
                { name: 'GDPR', desc: 'EU data protection', status: 'active' },
                { name: 'CCPA', desc: 'California privacy rights', status: 'active' },
              ].map(reg => (
                <div key={reg.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: c.gray[850], borderRadius: r.lg }}>
                  <CheckCircle2 size={18} style={{ color: c.success.DEFAULT }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[200] }}>{reg.name}</p>
                    <p style={{ fontSize: 12, color: c.gray[500] }}>{reg.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 16 }}>Data Retention Policies</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {complianceService.listRetentionPolicies().map(policy => (
                <div key={policy.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: c.gray[850], borderRadius: r.lg }}>
                  <div>
                    <p style={{ fontSize: 14, color: c.gray[200] }}>{policy.name}</p>
                    <p style={{ fontSize: 12, color: c.gray[500] }}>{policy.archiveAfterRetention ? 'Archive after retention' : 'Delete after retention'}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: c.primary.DEFAULT }}>{Math.round(policy.retentionDays / 365)} years</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      
      {/* DNC Tab - Fully Functional */}
      {activeTab === 'dnc' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100] }}>Do Not Call List</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.gray[500] }} />
                <input
                  placeholder="Search DNC..."
                  value={dncSearch}
                  onChange={(e) => setDncSearch(e.target.value)}
                  style={{ padding: '8px 12px 8px 34px', fontSize: 13, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none', width: 200 }}
                />
              </div>
              <Button variant="secondary" size="sm" icon={Upload} onClick={() => setShowImportDNC(true)}>Import CSV</Button>
              <Button size="sm" icon={Plus} onClick={() => setShowAddDNC(true)}>Add Number</Button>
            </div>
          </div>
          
          {/* Add DNC Form */}
          {showAddDNC && (
            <div style={{ padding: 16, background: c.gray[850], borderRadius: r.lg, marginBottom: 16, border: `1px solid ${c.gray[700]}` }}>
              <h4 style={{ fontSize: 14, fontWeight: 500, color: c.gray[200], marginBottom: 12 }}>Add Number to DNC List</h4>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <input
                  placeholder="Phone number (e.g., +1 555 123 4567)"
                  value={newDNCPhone}
                  onChange={(e) => setNewDNCPhone(e.target.value)}
                  style={{ flex: 1, minWidth: 200, padding: '10px 12px', fontSize: 14, background: c.gray[900], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none' }}
                />
                <select 
                  value={newDNCReason} 
                  onChange={(e) => setNewDNCReason(e.target.value)}
                  style={{ padding: '10px 12px', fontSize: 14, background: c.gray[900], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[300], outline: 'none' }}
                >
                  <option value="Customer request">Customer Request</option>
                  <option value="Legal complaint">Legal Complaint</option>
                  <option value="Wrong number">Wrong Number</option>
                  <option value="Other">Other</option>
                </select>
                <Button onClick={handleAddDNC}>Add to DNC</Button>
                <Button variant="secondary" onClick={() => setShowAddDNC(false)}>Cancel</Button>
              </div>
            </div>
          )}
          
          {/* DNC Table */}
          {filteredDNC.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Phone Number', 'Reason', 'Added', 'Added By', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: c.gray[500], textTransform: 'uppercase', borderBottom: `1px solid ${c.gray[800]}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDNC.map(entry => (
                    <tr key={entry.id}>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}`, fontSize: 14, color: c.gray[100], fontFamily: tokens.font.mono }}>{entry.phone}</td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}`, fontSize: 13, color: c.gray[400] }}>{entry.reason}</td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}`, fontSize: 13, color: c.gray[500] }}>{entry.addedAt}</td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}`, fontSize: 13, color: c.gray[400] }}>{entry.addedBy}</td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}` }}>
                        <button 
                          onClick={() => handleRemoveDNC(entry.id)}
                          style={{ padding: '4px 10px', fontSize: 12, background: c.error.muted, border: 'none', borderRadius: r.md, color: c.error.DEFAULT, cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', background: c.gray[850], borderRadius: r.lg }}>
              <Phone size={32} style={{ color: c.gray[600], marginBottom: 8 }} />
              <p style={{ fontSize: 14, color: c.gray[400] }}>{dncSearch ? 'No matching entries found' : 'No numbers on DNC list'}</p>
              <p style={{ fontSize: 12, color: c.gray[600] }}>Add numbers manually or import from CSV</p>
            </div>
          )}
        </Card>
      )}
      
      {/* Consent Tab - Fully Functional */}
      {activeTab === 'consent' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100] }}>Consent Records</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.gray[500] }} />
                <input
                  placeholder="Search consents..."
                  value={consentSearch}
                  onChange={(e) => setConsentSearch(e.target.value)}
                  style={{ padding: '8px 12px 8px 34px', fontSize: 13, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none', width: 200 }}
                />
              </div>
              <Button variant="secondary" size="sm" icon={Download} onClick={handleExportConsent}>Export Records</Button>
              <Button size="sm" icon={Plus} onClick={() => setShowAddConsent(true)}>Record Consent</Button>
            </div>
          </div>
          
          {/* Consent Types Legend */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            {Object.entries(consentTypeLabels).map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: consentTypeColors[key] }} />
                <span style={{ fontSize: 12, color: c.gray[400] }}>{label}</span>
              </div>
            ))}
          </div>
          
          {/* Consent Table */}
          {filteredConsent.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Contact', 'Consent Type', 'Method', 'Granted', 'Expires', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: c.gray[500], textTransform: 'uppercase', borderBottom: `1px solid ${c.gray[800]}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredConsent.map(record => (
                    <tr key={record.id}>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}` }}>
                        <p style={{ fontSize: 14, color: c.gray[100] }}>{record.leadName}</p>
                        <p style={{ fontSize: 12, color: c.gray[500] }}>{record.email}</p>
                      </td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}` }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: r.full, fontSize: 12, background: `${consentTypeColors[record.type]}20`, color: consentTypeColors[record.type] }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: consentTypeColors[record.type] }} />
                          {consentTypeLabels[record.type]}
                        </span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}`, fontSize: 13, color: c.gray[400], textTransform: 'capitalize' }}>{record.method}</td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}`, fontSize: 13, color: c.gray[400] }}>{record.grantedAt}</td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}`, fontSize: 13, color: c.gray[400] }}>{record.expiresAt}</td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}` }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: r.full, fontSize: 11, fontWeight: 500,
                          background: record.status === 'active' ? c.success.muted : record.status === 'expired' ? c.warning.muted : c.error.muted,
                          color: record.status === 'active' ? c.success.DEFAULT : record.status === 'expired' ? c.warning.DEFAULT : c.error.DEFAULT,
                          textTransform: 'capitalize'
                        }}>
                          {record.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}` }}>
                        {record.status === 'active' && (
                          <button 
                            onClick={() => handleRevokeConsent(record.id)}
                            style={{ padding: '4px 10px', fontSize: 12, background: c.error.muted, border: 'none', borderRadius: r.md, color: c.error.DEFAULT, cursor: 'pointer' }}
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', background: c.gray[850], borderRadius: r.lg }}>
              <CheckCircle2 size={32} style={{ color: c.gray[600], marginBottom: 8 }} />
              <p style={{ fontSize: 14, color: c.gray[400] }}>No consent records found</p>
            </div>
          )}
        </Card>
      )}
      
      {/* Audit Tab - Fully Functional */}
      {activeTab === 'audit' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100] }}>Audit Trail</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <select 
                value={auditFilter} 
                onChange={(e) => setAuditFilter(e.target.value)}
                style={{ padding: '8px 12px', fontSize: 13, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[300], outline: 'none' }}
              >
                <option value="all">All Events</option>
                <option value="consent">Consent Events</option>
                <option value="dnc">DNC Events</option>
                <option value="data">Data Events</option>
                <option value="access">Access Events</option>
              </select>
              <Button variant="secondary" size="sm" icon={Download} onClick={handleExportAudit}>Export Audit Log</Button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredAuditLogs.slice(0, 20).map(log => {
              const actionColors = {
                consent: c.success.DEFAULT,
                dnc: c.warning.DEFAULT,
                data: c.primary.DEFAULT,
                access: c.accent.DEFAULT,
              };
              const actionType = log.action.includes('consent') ? 'consent' : log.action.includes('dnc') ? 'dnc' : log.action.includes('data') ? 'data' : 'access';
              
              return (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: c.gray[850], borderRadius: r.lg }}>
                  <div style={{ width: 36, height: 36, borderRadius: r.md, background: `${actionColors[actionType]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={16} style={{ color: actionColors[actionType] }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[200] }}>{log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      <span style={{ padding: '2px 8px', borderRadius: r.full, fontSize: 10, background: `${actionColors[actionType]}20`, color: actionColors[actionType], textTransform: 'uppercase' }}>
                        {actionType}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: c.gray[500], marginTop: 2 }}>{log.details?.message || JSON.stringify(log.details).slice(0, 60)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: c.gray[600] }}>{fmt.date(log.timestamp)}</p>
                    <p style={{ fontSize: 10, color: c.gray[600] }}>{log.userId || 'System'}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredAuditLogs.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', background: c.gray[850], borderRadius: r.lg }}>
              <Clock size={32} style={{ color: c.gray[600], marginBottom: 8 }} />
              <p style={{ fontSize: 14, color: c.gray[400] }}>No audit logs found</p>
            </div>
          )}
        </Card>
      )}
      
      {/* Import DNC Modal */}
      {showImportDNC && (
        <ModalOverlay onClose={() => setShowImportDNC(false)} maxWidth={500}>
          <Card padding={0}>
            <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}` }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Import DNC Numbers</h2>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13, color: c.gray[400], marginBottom: 16 }}>
                Paste phone numbers below, one per line. Optionally add a comma-separated reason after each number.
              </p>
              <textarea
                value={importDNCText}
                onChange={(e) => setImportDNCText(e.target.value)}
                placeholder={"+1 555 123 4567, Customer request\n+1 555 234 5678, Legal complaint\n+1 555 345 6789"}
                style={{
                  width: '100%',
                  minHeight: 150,
                  padding: 12,
                  fontSize: 13,
                  fontFamily: tokens.font.mono,
                  background: c.gray[850],
                  border: `1px solid ${c.gray[700]}`,
                  borderRadius: r.md,
                  color: c.gray[100],
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              <p style={{ fontSize: 11, color: c.gray[600], marginTop: 8 }}>
                {importDNCText.split('\n').filter(l => l.trim()).length} numbers to import
              </p>
            </div>
            <div style={{ padding: 20, borderTop: `1px solid ${c.gray[800]}`, display: 'flex', gap: 10 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setShowImportDNC(false)}>Cancel</Button>
              <Button variant="gradient" style={{ flex: 1 }} onClick={handleImportDNC} disabled={!importDNCText.trim()}>
                <Upload size={16} style={{ marginRight: 8 }} /> Import Numbers
              </Button>
            </div>
          </Card>
        </ModalOverlay>
      )}
      
      {/* Add Consent Form Modal */}
      {showAddConsent && (
        <ModalOverlay onClose={() => setShowAddConsent(false)} maxWidth={480}>
          <Card padding={0}>
            <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}` }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Record Consent</h2>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input
                label="Lead Name"
                placeholder="John Smith"
                value={newConsent.leadName}
                onChange={(e) => setNewConsent({ ...newConsent, leadName: e.target.value })}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                value={newConsent.email}
                onChange={(e) => setNewConsent({ ...newConsent, email: e.target.value })}
              />
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 6 }}>Consent Type</label>
                <select
                  value={newConsent.type}
                  onChange={(e) => setNewConsent({ ...newConsent, type: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[200], outline: 'none' }}
                >
                  <option value="express_written">Express Written Consent</option>
                  <option value="express_oral">Express Oral Consent</option>
                  <option value="implied">Implied Consent</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 6 }}>Collection Method</label>
                <select
                  value={newConsent.method}
                  onChange={(e) => setNewConsent({ ...newConsent, method: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[200], outline: 'none' }}
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone Call</option>
                  <option value="sms">SMS</option>
                  <option value="web_form">Web Form</option>
                  <option value="in_person">In Person</option>
                </select>
              </div>
            </div>
            <div style={{ padding: 20, borderTop: `1px solid ${c.gray[800]}`, display: 'flex', gap: 10 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setShowAddConsent(false)}>Cancel</Button>
              <Button variant="gradient" style={{ flex: 1 }} onClick={handleAddConsent} disabled={!newConsent.leadName.trim() || !newConsent.email.trim()}>
                <Plus size={16} style={{ marginRight: 8 }} /> Record Consent
              </Button>
            </div>
          </Card>
        </ModalOverlay>
      )}
    </div>
  );
};

// ============================================================================
// HELP PAGE - Quick Guide
// ============================================================================
const HelpPage = ({ user }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  
  const helpSections = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      title: 'Dashboard',
      description: 'Your command center for lead management',
      content: [
        { q: 'What is the Dashboard?', a: 'The Dashboard gives you a quick overview of your pipeline health, including total leads, conversion metrics, and top opportunities requiring attention.' },
        { q: 'What do the metrics mean?', a: 'Total Leads shows your database size. Hot Leads are high-intent prospects ready to buy. Pipeline Value is the total potential revenue. Avg Score indicates overall lead quality.' },
        { q: 'How do I use Top Leads?', a: 'Top Leads are ranked by our AI scoring system. Click any lead to view details or use quick actions to email or call them directly.' },
      ],
    },
    {
      id: 'leads',
      icon: Users,
      title: 'Leads',
      description: 'View, filter, and manage your lead database',
      content: [
        { q: 'How are leads scored?', a: 'Our AI analyzes 5 factors: engagement history (25%), title seniority (20%), contact recency (20%), intent signals (20%), and deal fit (15%). Scores range from 1-100.' },
        { q: 'What do the status colors mean?', a: 'Hot (red) = high buying intent, ready to close. Warm (orange) = engaged, needs nurturing. New (blue) = recently added. Cold (gray) = low engagement or stale.' },
        { q: 'How do I export leads?', a: 'Click the Export button to download your leads as CSV or JSON. You can export all leads or apply filters first to export a subset.' },
        { q: 'Can I search for specific leads?', a: 'Yes, use the search bar to find leads by name, company, or email. Results appear in real-time as you type.' },
      ],
    },
    {
      id: 'sequences',
      icon: Zap,
      title: 'Sequences',
      description: 'Automated multi-channel outreach campaigns',
      content: [
        { q: 'What is a Sequence?', a: 'A sequence is an automated series of touchpoints (emails, calls, LinkedIn messages) that run on a schedule. When a lead is enrolled, they receive each step automatically.' },
        { q: 'What channels are supported?', a: 'Email, LinkedIn (connection requests, messages), SMS, phone calls, and manual tasks. Mix channels for higher response rates.' },
        { q: 'When do sequences pause?', a: 'Sequences automatically pause when a lead replies, books a meeting, or opts out. You can also manually pause any enrollment.' },
        { q: 'How do I create a sequence?', a: 'Click Create Sequence and choose a template (Initial Outreach, Warm Nurture, etc.) or build from scratch. Add steps, set delays, and activate when ready.' },
      ],
    },
    {
      id: 'ai',
      icon: Brain,
      title: 'AI Assistant',
      description: 'Your intelligent sales companion',
      content: [
        { q: 'What can the AI Assistant do?', a: 'It can prioritize your leads, write personalized emails and call scripts, forecast pipeline revenue, identify at-risk deals, and provide objection handling strategies.' },
        { q: 'How do I get the best results?', a: 'Be specific in your questions. Instead of "help me", try "write a follow-up email for John at Acme Corp who hasn\'t responded in 5 days".' },
        { q: 'Does it know my leads?', a: 'Yes, the AI has full context on your pipeline including names, scores, values, and interaction history. It uses this data to personalize recommendations.' },
        { q: 'What are Quick Prompts?', a: 'Pre-built questions to get you started fast. Click any prompt to use it, or type your own question.' },
      ],
    },
    {
      id: 'integrations',
      icon: RefreshCw,
      title: 'Integrations',
      description: 'Connect your tools for seamless workflows',
      content: [
        { q: 'How do I set up an integration?', a: 'Go to Integrations, click any service, follow the setup steps shown, enter your API credentials, then click "Test Connection" to verify. Each integration shows step-by-step instructions for getting your API keys.' },
        { q: 'Where do I get API keys?', a: 'Each integration has detailed instructions. Generally: CRMs provide keys in Settings > API/Integrations. For SendGrid, go to Settings > API Keys. For Twilio, find Account SID and Auth Token on your dashboard.' },
        { q: 'What CRMs are supported?', a: 'HubSpot (private app token), Pipedrive (API token), and Salesforce (OAuth). Each syncs leads bi-directionally - changes in either system stay in sync.' },
        { q: 'How do I connect email sending?', a: 'We support SendGrid. Create a SendGrid account, generate an API key with full access, and enter it in the Email integration setup along with your verified sender email.' },
        { q: 'How does SMS/calling work?', a: 'Connect Twilio by entering your Account SID, Auth Token, and a purchased phone number. This enables sequence steps with SMS and voice calls.' },
        { q: 'What enrichment services work?', a: 'Clearbit and Apollo.io. Both automatically fill in company data (size, revenue, industry, tech stack) and contact details (title, phone, social profiles) for your leads.' },
        { q: 'How do I verify emails?', a: 'Connect ZeroBounce or NeverBounce. These check if email addresses are deliverable before you send, protecting your sender reputation and improving deliverability.' },
        { q: 'Can I export my settings?', a: 'Yes, click "Export .env Template" to get a file with all your configuration keys. This is useful for backup or setting up on a new environment.' },
      ],
    },
    {
      id: 'compliance',
      icon: CheckCircle2,
      title: 'Compliance',
      description: 'Stay compliant with regulations',
      content: [
        { q: 'What is the DNC List?', a: 'Do Not Call list contains phone numbers that must not be contacted. Numbers are checked automatically before any call or SMS sequence step.' },
        { q: 'What is TCPA?', a: 'The Telephone Consumer Protection Act requires consent before automated calls or texts. We track consent status and block non-compliant outreach.' },
        { q: 'What is the Audit Trail?', a: 'A complete log of all compliance-related actions including consent records, opt-outs, and data changes. Required for regulatory audits.' },
        { q: 'How do retention policies work?', a: 'Data retention policies automatically archive or delete old records after a set period (e.g., 3 years for lead data). This helps with GDPR/CCPA compliance.' },
      ],
    },
  ];
  
  const quickTips = [
    { icon: Target, tip: 'Focus on Hot leads first - they have the highest conversion probability' },
    { icon: Clock, tip: 'Best times to reach prospects: Tuesday-Thursday, 9-11am or 3-5pm' },
    { icon: Mail, tip: 'Keep initial emails under 100 words for higher response rates' },
    { icon: Phone, tip: 'Always check DNC status before making outbound calls' },
    { icon: Brain, tip: 'Ask the AI Assistant for objection handling scripts before important calls' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: c.gray[100], marginBottom: 8 }}>Help Center</h1>
        <p style={{ fontSize: 14, color: c.gray[500] }}>Quick guides to help you get the most out of LeadGen Pro</p>
      </div>
      
      {/* Quick Tips */}
      <Card style={{ background: `linear-gradient(135deg, ${c.primary[50]}, ${c.accent.muted})`, border: `1px solid ${c.primary.DEFAULT}30` }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lightbulb size={18} style={{ color: c.primary.DEFAULT }} />
          Quick Tips
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {quickTips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <tip.icon size={16} style={{ color: c.primary.DEFAULT, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: c.gray[300] }}>{tip.tip}</span>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Feature Guides */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {helpSections.map(section => {
          const isExpanded = expandedSection === section.id;
          const Icon = section.icon;
          
          return (
            <Card key={section.id} padding={0} style={{ overflow: 'hidden' }}>
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: 18,
                  background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: r.lg, background: c.primary[100], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} style={{ color: c.primary.DEFAULT }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 2 }}>{section.title}</h3>
                  <p style={{ fontSize: 13, color: c.gray[500] }}>{section.description}</p>
                </div>
                <ChevronDown size={20} style={{ color: c.gray[500], transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: tokens.transition.fast }} />
              </button>
              
              {isExpanded && (
                <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${c.gray[800]}`, marginTop: -1 }}>
                  <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {section.content.map((item, i) => (
                      <div key={i}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[200], marginBottom: 6 }}>{item.q}</p>
                        <p style={{ fontSize: 13, color: c.gray[400], lineHeight: 1.6 }}>{item.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      
      {/* Glossary */}
      <Card>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 16 }}>Glossary</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {[
            { term: 'Lead Score', def: 'AI-calculated 1-100 rating indicating conversion likelihood' },
            { term: 'Hot Lead', def: 'High-intent prospect showing strong buying signals' },
            { term: 'Sequence', def: 'Automated series of outreach touchpoints' },
            { term: 'Enrollment', def: 'Adding a lead to a sequence' },
            { term: 'Pipeline Value', def: 'Total potential revenue from all active leads' },
            { term: 'Conversion Rate', def: 'Percentage of leads that become customers' },
            { term: 'DNC', def: 'Do Not Call - regulatory list of blocked numbers' },
            { term: 'TCPA', def: 'Telephone Consumer Protection Act - US calling regulations' },
            { term: 'Enrichment', def: 'Automatically adding data to lead records' },
            { term: 'Bounce Rate', def: 'Percentage of emails that fail to deliver' },
          ].map(item => (
            <div key={item.term} style={{ padding: 12, background: c.gray[850], borderRadius: r.md }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: c.gray[200], marginBottom: 4 }}>{item.term}</p>
              <p style={{ fontSize: 12, color: c.gray[500] }}>{item.def}</p>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Contact Support */}
      <Card style={{ textAlign: 'center', padding: 32 }}>
        <MessageSquare size={32} style={{ color: c.gray[500], marginBottom: 12 }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, color: c.gray[100], marginBottom: 6 }}>Need More Help?</h3>
        <p style={{ fontSize: 13, color: c.gray[500], marginBottom: 16 }}>Our team is here to assist you</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button variant="secondary" icon={Mail}>Email Support</Button>
          <Button icon={Phone}>Schedule a Call</Button>
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// ADMIN PAGES
// ============================================================================
const AdminClients = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [showMetrics, setShowMetrics] = useState(false);
  
  const handleClientClick = (client) => {
    setSelectedClient(client);
    setShowMetrics(true);
  };
  
  return (
    <>
      <Card>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: c.gray[100], marginBottom: 16, fontFamily: tokens.font.heading }}>Client Management</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MOCK_USERS.clients.map(client => {
            const clientLeads = MOCK_LEADS_BY_CLIENT[client.id] || [];
            const hotCount = clientLeads.filter(l => l.status === 'Hot').length;
            
            return (
              <div 
                key={client.id} 
                onClick={() => handleClientClick(client)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 14, padding: 14, 
                  background: c.gray[850], borderRadius: r.lg, cursor: 'pointer',
                  border: `1px solid ${c.gray[800]}`, transition: tokens.transition.fast,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.primary.DEFAULT; e.currentTarget.style.background = c.gray[800]; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.gray[800]; e.currentTarget.style.background = c.gray[850]; }}
              >
                <UserOrgAvatar userName={client.name} orgName={client.company} userSize={40} />
                <div style={{ flex: 1, marginLeft: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[100] }}>{client.name}</p>
                  <p style={{ fontSize: 13, color: c.gray[500] }}>{client.email}</p>
                </div>
                <div style={{ textAlign: 'right', marginRight: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: c.gray[200] }}>{clientLeads.length} leads</p>
                  {hotCount > 0 && <p style={{ fontSize: 12, color: c.hot.text }}>{hotCount} hot</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.gray[500] }}>
                  <BarChart3 size={18} />
                  <ChevronRight size={18} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      
      {/* Client Metrics Modal */}
      <ClientMetricsModal 
        isOpen={showMetrics} 
        onClose={() => setShowMetrics(false)} 
        client={selectedClient}
        leads={selectedClient ? MOCK_LEADS_BY_CLIENT[selectedClient.id] : []}
      />
    </>
  );
};

const AdminUpload = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  const handleUpload = (files) => {
    // Simulate processing uploaded files
    const processedFiles = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      status: 'processed',
      leadsImported: Math.floor(Math.random() * 500) + 50,
    }));
    setUploadedFiles(prev => [...processedFiles, ...prev]);
  };
  
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Upload Card */}
        <Card>
          <div 
            onClick={() => setShowUploadModal(true)}
            style={{ 
              textAlign: 'center', padding: 60, cursor: 'pointer',
              border: `2px dashed ${c.gray[700]}`, borderRadius: r.xl,
              background: c.gray[850], transition: tokens.transition.base,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.primary.DEFAULT; e.currentTarget.style.background = c.gray[800]; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.gray[700]; e.currentTarget.style.background = c.gray[850]; }}
          >
            <div style={{ 
              width: 64, height: 64, borderRadius: r.xl, margin: '0 auto 16px',
              background: tokens.gradients.brandSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Upload size={28} style={{ color: c.primary.DEFAULT }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], marginBottom: 8, fontFamily: tokens.font.heading }}>Upload Lead Data</h2>
            <p style={{ fontSize: 14, color: c.gray[400], marginBottom: 20 }}>Click to browse or drag and drop files</p>
            <p style={{ fontSize: 12, color: c.gray[600] }}>Supports CSV, Excel (.xlsx), and JSON files</p>
          </div>
        </Card>
        
        {/* Recent Uploads */}
        {uploadedFiles.length > 0 && (
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 16, fontFamily: tokens.font.heading }}>Recent Uploads</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {uploadedFiles.slice(0, 5).map(file => (
                <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: c.gray[850], borderRadius: r.lg }}>
                  <div style={{ width: 36, height: 36, borderRadius: r.md, background: c.primary[100], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={18} style={{ color: c.primary.DEFAULT }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[200] }}>{file.name}</p>
                    <p style={{ fontSize: 12, color: c.gray[500] }}>{fmt.date(file.uploadedAt)} • {(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} style={{ color: c.success.DEFAULT }} />
                    <span style={{ fontSize: 13, color: c.success.DEFAULT, fontWeight: 500 }}>{file.leadsImported} leads</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
      
      {/* File Upload Modal */}
      <FileUploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />
    </>
  );
};

// ============================================================================
// SECURITY CENTER PAGE - Comprehensive Security & Data Protection
// ============================================================================
const SecurityCenterPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Security state
  const [securityHealth, setSecurityHealth] = useState({
    status: 'healthy',
    score: 85,
    lastChecked: new Date().toISOString(),
  });
  
  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  
  // Sessions state
  const [sessions, setSessions] = useState([
    { id: 'session_1', device: 'Chrome on Windows', location: 'Charlotte, NC', lastActive: new Date().toISOString(), current: true, ip: '192.168.1.xxx' },
    { id: 'session_2', device: 'Safari on iPhone', location: 'Charlotte, NC', lastActive: new Date(Date.now() - 2 * 3600000).toISOString(), current: false, ip: '192.168.1.xxx' },
    { id: 'session_3', device: 'Firefox on MacOS', location: 'New York, NY', lastActive: new Date(Date.now() - 24 * 3600000).toISOString(), current: false, ip: '10.0.0.xxx' },
  ]);
  
  // Data access log state
  const [accessLogs, setAccessLogs] = useState([
    { id: 'log_1', action: 'view', dataType: 'leads', timestamp: new Date().toISOString(), details: 'Viewed lead list' },
    { id: 'log_2', action: 'export', dataType: 'leads', timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'Exported 150 leads to CSV' },
    { id: 'log_3', action: 'modify', dataType: 'settings', timestamp: new Date(Date.now() - 7200000).toISOString(), details: 'Updated notification preferences' },
    { id: 'log_4', action: 'view', dataType: 'analytics', timestamp: new Date(Date.now() - 86400000).toISOString(), details: 'Viewed dashboard analytics' },
  ]);
  
  // Security alerts
  const [securityAlerts, setSecurityAlerts] = useState([
    { id: 'alert_1', severity: 'info', message: 'Password last changed 45 days ago', timestamp: new Date().toISOString(), dismissed: false },
  ]);
  
  // Trusted devices
  const [trustedDevices, setTrustedDevices] = useState([
    { id: 'dev_1', name: 'Work Laptop', type: 'laptop', browser: 'Chrome', os: 'Windows 11', registeredAt: new Date(Date.now() - 30 * 86400000).toISOString(), lastUsed: new Date().toISOString() },
    { id: 'dev_2', name: 'iPhone 15 Pro', type: 'mobile', browser: 'Safari', os: 'iOS 17', registeredAt: new Date(Date.now() - 60 * 86400000).toISOString(), lastUsed: new Date(Date.now() - 86400000).toISOString() },
  ]);
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    dataRetention: 365,
    shareAnalytics: false,
    marketingEmails: true,
    activityTracking: true,
  });
  
  // Export data state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  
  // Delete data state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  const tabs = [
    { id: 'overview', label: 'Security Overview', icon: Shield },
    { id: 'authentication', label: 'Authentication', icon: Lock },
    { id: 'sessions', label: 'Active Sessions', icon: Activity },
    { id: 'devices', label: 'Trusted Devices', icon: Briefcase },
    { id: 'privacy', label: 'Privacy & Data', icon: Eye },
    { id: 'logs', label: 'Access Logs', icon: FileText },
  ];
  
  // Handle 2FA setup
  const handleSetup2FA = () => {
    const secret = 'JBSWY3DPEHPK3PXP'; // Mock secret
    const backupCodes = ['A1B2C3D4', 'E5F6G7H8', 'I9J0K1L2', 'M3N4O5P6', 'Q7R8S9T0'];
    setTwoFASecret({ secret, backupCodes, qrUrl: `otpauth://totp/LeadGenPro:${user.email}?secret=${secret}&issuer=BluestarAI` });
    setShowSetup2FA(true);
  };
  
  const handleVerify2FA = () => {
    if (verificationCode.length === 6) {
      setTwoFAEnabled(true);
      setShowSetup2FA(false);
      setVerificationCode('');
    }
  };
  
  const handleDisable2FA = () => {
    if (confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      setTwoFAEnabled(false);
      setTwoFASecret(null);
    }
  };
  
  // Handle session management
  const revokeSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };
  
  const revokeAllSessions = () => {
    if (confirm('This will log you out of all other devices. Continue?')) {
      setSessions(prev => prev.filter(s => s.current));
    }
  };
  
  // Handle device management
  const removeDevice = (deviceId) => {
    setTrustedDevices(prev => prev.filter(d => d.id !== deviceId));
  };
  
  // Handle data export
  const handleExportData = () => {
    setIsExporting(true);
    setExportProgress(0);
    
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setTimeout(() => {
            setShowExportModal(false);
            alert('Your data export is ready for download.');
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };
  
  // Handle data deletion
  const handleDeleteData = () => {
    if (deleteConfirmText === 'DELETE MY DATA') {
      alert('Data deletion request submitted. You will receive a confirmation email within 24 hours.');
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    }
  };
  
  // Handle change password
  const handleChangePassword = () => {
    setPasswordError('');
    setPasswordSuccess(false);
    
    if (passwordForm.current.length < 8) {
      setPasswordError('Current password is incorrect');
      return;
    }
    if (passwordForm.new.length < 12) {
      setPasswordError('New password must be at least 12 characters');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (!/[A-Z]/.test(passwordForm.new) || !/[a-z]/.test(passwordForm.new) || !/\d/.test(passwordForm.new) || !/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.new)) {
      setPasswordError('Password must include uppercase, lowercase, number, and special character');
      return;
    }
    
    // Success
    setPasswordSuccess(true);
    setPasswordForm({ current: '', new: '', confirm: '' });
    setTimeout(() => {
      setShowChangePassword(false);
      setPasswordSuccess(false);
    }, 2000);
  };
  
  // Handle export access logs
  const handleExportAccessLogs = () => {
    const headers = ['ID', 'Action', 'Data Type', 'Details', 'Timestamp'];
    const rows = accessLogs.map(l => [l.id, l.action, l.dataType, l.details, l.timestamp]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Handle export user data with actual data
  const handleExportUserData = () => {
    setIsExporting(true);
    setExportProgress(0);
    
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Generate actual export data
          const exportData = {
            exportedAt: new Date().toISOString(),
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              company: user.company,
            },
            securitySettings: {
              twoFactorEnabled: twoFAEnabled,
              trustedDevices: trustedDevices.length,
              activeSessions: sessions.length,
            },
            privacySettings: privacySettings,
            accessHistory: accessLogs,
            securityAlerts: securityAlerts,
          };
          
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `user_data_export_${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
          
          setIsExporting(false);
          setTimeout(() => setShowExportModal(false), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };
  
  const getSecurityScoreColor = (score) => {
    if (score >= 80) return c.success.DEFAULT;
    if (score >= 60) return c.warning.DEFAULT;
    return c.error.DEFAULT;
  };
  
  const actionColors = {
    view: c.primary.DEFAULT,
    export: c.accent.DEFAULT,
    modify: c.warning.DEFAULT,
    delete: c.error.DEFAULT,
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: c.gray[900], borderRadius: r.lg, width: 'fit-content', border: `1px solid ${c.gray[800]}`, overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', fontSize: 14, fontWeight: 500, border: 'none', borderRadius: r.md, cursor: 'pointer',
              color: activeTab === tab.id ? c.gray[100] : c.gray[500],
              background: activeTab === tab.id ? tokens.gradients.brandSubtle : 'transparent',
              borderLeft: activeTab === tab.id ? `2px solid ${c.accent.DEFAULT}` : '2px solid transparent',
              transition: tokens.transition.fast, whiteSpace: 'nowrap',
            }}>
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* ========== SECURITY OVERVIEW TAB ========== */}
      {activeTab === 'overview' && (
        <>
          {/* Security Score Card */}
          <Card gradient>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 120, height: 120 }}>
                <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke={c.gray[800]} strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke={getSecurityScoreColor(securityHealth.score)} strokeWidth="10" 
                    strokeDasharray={`${securityHealth.score * 3.14} 314`} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: getSecurityScoreColor(securityHealth.score) }}>{securityHealth.score}</span>
                  <span style={{ fontSize: 11, color: c.gray[500] }}>Score</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Shield size={24} style={{ color: getSecurityScoreColor(securityHealth.score) }} />
                  <h2 style={{ fontSize: 20, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>
                    {securityHealth.status === 'healthy' ? 'Your account is secure' : 'Security improvements needed'}
                  </h2>
                </div>
                <p style={{ fontSize: 14, color: c.gray[400], marginBottom: 16, lineHeight: 1.5 }}>
                  Your security score is based on password strength, two-factor authentication, session management, and recent activity patterns.
                </p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {twoFAEnabled ? <CheckCircle2 size={16} style={{ color: c.success.DEFAULT }} /> : <AlertCircle size={16} style={{ color: c.warning.DEFAULT }} />}
                    <span style={{ fontSize: 13, color: c.gray[300] }}>2FA {twoFAEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} style={{ color: c.success.DEFAULT }} />
                    <span style={{ fontSize: 13, color: c.gray[300] }}>{sessions.length} Active Sessions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} style={{ color: c.success.DEFAULT }} />
                    <span style={{ fontSize: 13, color: c.gray[300] }}>{trustedDevices.length} Trusted Devices</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Security Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: r.lg, background: c.success.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={22} style={{ color: c.success.DEFAULT }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: c.gray[500] }}>Password Strength</p>
                  <p style={{ fontSize: 18, fontWeight: 600, color: c.success.DEFAULT }}>Strong</p>
                </div>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: r.lg, background: twoFAEnabled ? c.success.muted : c.warning.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={22} style={{ color: twoFAEnabled ? c.success.DEFAULT : c.warning.DEFAULT }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: c.gray[500] }}>Two-Factor Auth</p>
                  <p style={{ fontSize: 18, fontWeight: 600, color: twoFAEnabled ? c.success.DEFAULT : c.warning.DEFAULT }}>{twoFAEnabled ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: r.lg, background: c.primary[100], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={22} style={{ color: c.primary.DEFAULT }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: c.gray[500] }}>Active Sessions</p>
                  <p style={{ fontSize: 18, fontWeight: 600, color: c.gray[100] }}>{sessions.length}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: r.lg, background: c.accent.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={22} style={{ color: c.accent.DEFAULT }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: c.gray[500] }}>Data Accesses (24h)</p>
                  <p style={{ fontSize: 18, fontWeight: 600, color: c.gray[100] }}>{accessLogs.filter(l => new Date(l.timestamp) > new Date(Date.now() - 86400000)).length}</p>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Security Alerts */}
          {securityAlerts.filter(a => !a.dismissed).length > 0 && (
            <Card>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 16, fontFamily: tokens.font.heading }}>Security Recommendations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {securityAlerts.filter(a => !a.dismissed).map(alert => (
                  <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: c.gray[850], borderRadius: r.md, border: `1px solid ${c.gray[800]}` }}>
                    <AlertCircle size={18} style={{ color: alert.severity === 'warning' ? c.warning.DEFAULT : c.primary.light, flexShrink: 0 }} />
                    <p style={{ flex: 1, fontSize: 13, color: c.gray[300] }}>{alert.message}</p>
                    <Button variant="ghost" size="sm" onClick={() => setSecurityAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, dismissed: true } : a))}>Dismiss</Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {/* Quick Actions */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 16, fontFamily: tokens.font.heading }}>Quick Security Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <Button variant="secondary" onClick={() => setActiveTab('authentication')}>
                <Lock size={16} style={{ marginRight: 8 }} /> Change Password
              </Button>
              <Button variant="secondary" onClick={() => twoFAEnabled ? setActiveTab('authentication') : handleSetup2FA()}>
                <Shield size={16} style={{ marginRight: 8 }} /> {twoFAEnabled ? 'Manage 2FA' : 'Enable 2FA'}
              </Button>
              <Button variant="secondary" onClick={() => setActiveTab('sessions')}>
                <Activity size={16} style={{ marginRight: 8 }} /> Review Sessions
              </Button>
              <Button variant="secondary" onClick={() => setShowExportModal(true)}>
                <Download size={16} style={{ marginRight: 8 }} /> Export My Data
              </Button>
            </div>
          </Card>
        </>
      )}
      
      {/* ========== AUTHENTICATION TAB ========== */}
      {activeTab === 'authentication' && (
        <>
          {/* Password Section */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 16, fontFamily: tokens.font.heading }}>Password</h3>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: c.gray[400], marginBottom: 8 }}>Last changed: 45 days ago</p>
                <p style={{ fontSize: 13, color: c.gray[500], lineHeight: 1.5 }}>
                  We recommend changing your password every 90 days. Use a strong, unique password that you don't use elsewhere.
                </p>
              </div>
              <Button variant="secondary" onClick={() => setShowChangePassword(true)}>Change Password</Button>
            </div>
            
            {/* Password Requirements */}
            <div style={{ marginTop: 20, padding: 16, background: c.gray[850], borderRadius: r.lg }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 12 }}>Password Requirements</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {[
                  'At least 12 characters',
                  'One uppercase letter',
                  'One lowercase letter',
                  'One number',
                  'One special character',
                  'No common patterns',
                ].map((req, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={14} style={{ color: c.success.DEFAULT }} />
                    <span style={{ fontSize: 12, color: c.gray[400] }}>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          
          {/* Two-Factor Authentication */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Two-Factor Authentication</h3>
                <p style={{ fontSize: 13, color: c.gray[500], marginTop: 4 }}>Add an extra layer of security to your account</p>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: r.full, fontSize: 12, fontWeight: 500,
                background: twoFAEnabled ? c.success.muted : c.gray[800],
                color: twoFAEnabled ? c.success.DEFAULT : c.gray[400],
              }}>
                {twoFAEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            
            {twoFAEnabled ? (
              <div>
                <p style={{ fontSize: 13, color: c.gray[400], marginBottom: 16, lineHeight: 1.5 }}>
                  Two-factor authentication is enabled on your account. You'll need to enter a code from your authenticator app when signing in.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button variant="secondary">View Backup Codes</Button>
                  <Button variant="ghost" style={{ color: c.error.DEFAULT }} onClick={handleDisable2FA}>Disable 2FA</Button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: c.gray[400], marginBottom: 16, lineHeight: 1.5 }}>
                  Protect your account with an authenticator app like Google Authenticator, Authy, or 1Password. 
                  After enabling, you'll need to enter a code from the app each time you sign in.
                </p>
                <Button variant="gradient" onClick={handleSetup2FA}>
                  <Shield size={16} style={{ marginRight: 8 }} /> Enable Two-Factor Authentication
                </Button>
              </div>
            )}
          </Card>
          
          {/* Login History */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 16, fontFamily: tokens.font.heading }}>Recent Login Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { time: 'Just now', device: 'Chrome on Windows', location: 'Charlotte, NC', status: 'success' },
                { time: '2 hours ago', device: 'Safari on iPhone', location: 'Charlotte, NC', status: 'success' },
                { time: 'Yesterday', device: 'Chrome on Windows', location: 'Charlotte, NC', status: 'success' },
                { time: '3 days ago', device: 'Unknown Browser', location: 'New York, NY', status: 'blocked' },
              ].map((login, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: c.gray[850], borderRadius: r.md }}>
                  {login.status === 'success' ? (
                    <CheckCircle2 size={18} style={{ color: c.success.DEFAULT }} />
                  ) : (
                    <AlertCircle size={18} style={{ color: c.error.DEFAULT }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: c.gray[200] }}>{login.device}</p>
                    <p style={{ fontSize: 12, color: c.gray[500] }}>{login.location} • {login.time}</p>
                  </div>
                  <span style={{ fontSize: 11, color: login.status === 'success' ? c.success.DEFAULT : c.error.DEFAULT }}>
                    {login.status === 'success' ? 'Successful' : 'Blocked'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
      
      {/* ========== SESSIONS TAB ========== */}
      {activeTab === 'sessions' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Active Sessions</h2>
              <p style={{ fontSize: 13, color: c.gray[500], marginTop: 4 }}>Manage your active login sessions across devices</p>
            </div>
            {sessions.length > 1 && (
              <Button variant="secondary" onClick={revokeAllSessions}>
                Sign Out All Other Devices
              </Button>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions.map(session => (
              <Card key={session.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: r.lg, background: session.current ? c.success.muted : c.gray[800], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {session.device.includes('iPhone') || session.device.includes('Mobile') ? (
                      <Phone size={24} style={{ color: session.current ? c.success.DEFAULT : c.gray[400] }} />
                    ) : (
                      <Briefcase size={24} style={{ color: session.current ? c.success.DEFAULT : c.gray[400] }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100] }}>{session.device}</h3>
                      {session.current && (
                        <span style={{ padding: '2px 8px', borderRadius: r.full, fontSize: 10, fontWeight: 500, background: c.success.muted, color: c.success.DEFAULT }}>
                          This Device
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: c.gray[500], marginTop: 2 }}>
                      {session.location} • IP: {session.ip}
                    </p>
                    <p style={{ fontSize: 12, color: c.gray[600], marginTop: 2 }}>
                      Last active: {session.current ? 'Now' : fmt.date(session.lastActive)}
                    </p>
                  </div>
                  {!session.current && (
                    <Button variant="ghost" size="sm" style={{ color: c.error.DEFAULT }} onClick={() => revokeSession(session.id)}>
                      Sign Out
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      
      {/* ========== TRUSTED DEVICES TAB ========== */}
      {activeTab === 'devices' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Trusted Devices</h2>
              <p style={{ fontSize: 13, color: c.gray[500], marginTop: 4 }}>Devices that don't require additional verification</p>
            </div>
          </div>
          
          <Card style={{ background: c.primary[50] }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Shield size={20} style={{ color: c.primary.DEFAULT, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 13, color: c.gray[200], lineHeight: 1.5 }}>
                  Trusted devices are remembered and won't require two-factor authentication for 30 days. 
                  Remove any devices you don't recognize or no longer use.
                </p>
              </div>
            </div>
          </Card>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {trustedDevices.map(device => (
              <Card key={device.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: r.lg, background: c.gray[800], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {device.type === 'mobile' ? (
                      <Phone size={24} style={{ color: c.gray[400] }} />
                    ) : (
                      <Briefcase size={24} style={{ color: c.gray[400] }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100] }}>{device.name}</h3>
                    <p style={{ fontSize: 13, color: c.gray[500], marginTop: 2 }}>
                      {device.browser} on {device.os}
                    </p>
                    <p style={{ fontSize: 12, color: c.gray[600], marginTop: 2 }}>
                      Registered: {fmt.date(device.registeredAt)} • Last used: {fmt.date(device.lastUsed)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" style={{ color: c.error.DEFAULT }} onClick={() => removeDevice(device.id)}>
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      
      {/* ========== PRIVACY & DATA TAB ========== */}
      {activeTab === 'privacy' && (
        <>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Privacy & Data Management</h2>
            <p style={{ fontSize: 13, color: c.gray[500], marginTop: 4 }}>Control how your data is used and manage your privacy preferences</p>
          </div>
          
          {/* Data Protection Notice */}
          <Card gradient>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: r.lg, background: c.primary[100], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={24} style={{ color: c.primary.DEFAULT }} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 6 }}>Your Data is Protected</h3>
                <p style={{ fontSize: 13, color: c.gray[400], lineHeight: 1.5 }}>
                  We use industry-standard encryption (AES-256) to protect your data at rest and in transit. 
                  Your data is stored in SOC 2 Type II certified data centers with GDPR and CCPA compliance.
                </p>
              </div>
            </div>
          </Card>
          
          {/* Privacy Settings */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 16, fontFamily: tokens.font.heading }}>Privacy Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[200] }}>Activity Tracking</p>
                  <p style={{ fontSize: 12, color: c.gray[500] }}>Track your activity to personalize recommendations</p>
                </div>
                <label style={{ position: 'relative', width: 48, height: 24, cursor: 'pointer' }}>
                  <input type="checkbox" checked={privacySettings.activityTracking} onChange={(e) => setPrivacySettings({ ...privacySettings, activityTracking: e.target.checked })} style={{ display: 'none' }} />
                  <span style={{ position: 'absolute', inset: 0, background: privacySettings.activityTracking ? c.success.DEFAULT : c.gray[700], borderRadius: 12, transition: 'background 200ms' }}>
                    <span style={{ position: 'absolute', top: 2, left: privacySettings.activityTracking ? 26 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 200ms' }} />
                  </span>
                </label>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[200] }}>Share Anonymous Analytics</p>
                  <p style={{ fontSize: 12, color: c.gray[500] }}>Help us improve by sharing anonymous usage data</p>
                </div>
                <label style={{ position: 'relative', width: 48, height: 24, cursor: 'pointer' }}>
                  <input type="checkbox" checked={privacySettings.shareAnalytics} onChange={(e) => setPrivacySettings({ ...privacySettings, shareAnalytics: e.target.checked })} style={{ display: 'none' }} />
                  <span style={{ position: 'absolute', inset: 0, background: privacySettings.shareAnalytics ? c.success.DEFAULT : c.gray[700], borderRadius: 12, transition: 'background 200ms' }}>
                    <span style={{ position: 'absolute', top: 2, left: privacySettings.shareAnalytics ? 26 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 200ms' }} />
                  </span>
                </label>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[200] }}>Marketing Communications</p>
                  <p style={{ fontSize: 12, color: c.gray[500] }}>Receive product updates and promotional emails</p>
                </div>
                <label style={{ position: 'relative', width: 48, height: 24, cursor: 'pointer' }}>
                  <input type="checkbox" checked={privacySettings.marketingEmails} onChange={(e) => setPrivacySettings({ ...privacySettings, marketingEmails: e.target.checked })} style={{ display: 'none' }} />
                  <span style={{ position: 'absolute', inset: 0, background: privacySettings.marketingEmails ? c.success.DEFAULT : c.gray[700], borderRadius: 12, transition: 'background 200ms' }}>
                    <span style={{ position: 'absolute', top: 2, left: privacySettings.marketingEmails ? 26 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 200ms' }} />
                  </span>
                </label>
              </div>
            </div>
          </Card>
          
          {/* Data Retention */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 16, fontFamily: tokens.font.heading }}>Data Retention</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[200] }}>Retention Period</p>
                <p style={{ fontSize: 12, color: c.gray[500] }}>How long we keep your data after account closure</p>
              </div>
              <select value={privacySettings.dataRetention} onChange={(e) => setPrivacySettings({ ...privacySettings, dataRetention: parseInt(e.target.value) })}
                style={{ padding: '8px 12px', background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[200], fontSize: 13 }}>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
                <option value={730}>2 years</option>
              </select>
            </div>
          </Card>
          
          {/* Data Actions */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 16, fontFamily: tokens.font.heading }}>Your Data Rights (GDPR / CCPA)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <div style={{ padding: 16, background: c.gray[850], borderRadius: r.lg }}>
                <Download size={24} style={{ color: c.primary.DEFAULT, marginBottom: 12 }} />
                <h4 style={{ fontSize: 14, fontWeight: 600, color: c.gray[200], marginBottom: 4 }}>Export Your Data</h4>
                <p style={{ fontSize: 12, color: c.gray[500], marginBottom: 12, lineHeight: 1.5 }}>
                  Download a copy of all your data in a portable format (JSON)
                </p>
                <Button variant="secondary" size="sm" onClick={() => setShowExportModal(true)}>Request Export</Button>
              </div>
              
              <div style={{ padding: 16, background: c.gray[850], borderRadius: r.lg }}>
                <Trash2 size={24} style={{ color: c.error.DEFAULT, marginBottom: 12 }} />
                <h4 style={{ fontSize: 14, fontWeight: 600, color: c.gray[200], marginBottom: 4 }}>Delete Your Data</h4>
                <p style={{ fontSize: 12, color: c.gray[500], marginBottom: 12, lineHeight: 1.5 }}>
                  Permanently delete your account and all associated data
                </p>
                <Button variant="ghost" size="sm" style={{ color: c.error.DEFAULT }} onClick={() => setShowDeleteModal(true)}>Request Deletion</Button>
              </div>
            </div>
          </Card>
        </>
      )}
      
      {/* ========== ACCESS LOGS TAB ========== */}
      {activeTab === 'logs' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Data Access Logs</h2>
              <p style={{ fontSize: 13, color: c.gray[500], marginTop: 4 }}>View history of all data access and modifications</p>
            </div>
            <Button variant="secondary" icon={Download} onClick={handleExportAccessLogs}>Export Logs</Button>
          </div>
          
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 120px 1fr 150px', gap: 16, padding: '12px 16px', background: c.gray[850], borderRadius: `${r.md}px ${r.md}px 0 0` }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: c.gray[500], textTransform: 'uppercase' }}>Action</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: c.gray[500], textTransform: 'uppercase' }}>Data Type</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: c.gray[500], textTransform: 'uppercase' }}>Details</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: c.gray[500], textTransform: 'uppercase' }}>Timestamp</span>
              </div>
              {accessLogs.map((log, i) => (
                <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '100px 120px 1fr 150px', gap: 16, padding: '12px 16px', background: i % 2 === 0 ? c.gray[900] : c.gray[850], borderRadius: i === accessLogs.length - 1 ? `0 0 ${r.md}px ${r.md}px` : 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: actionColors[log.action] || c.gray[400], textTransform: 'capitalize' }}>{log.action}</span>
                  <span style={{ fontSize: 12, color: c.gray[300], textTransform: 'capitalize' }}>{log.dataType}</span>
                  <span style={{ fontSize: 12, color: c.gray[400] }}>{log.details}</span>
                  <span style={{ fontSize: 12, color: c.gray[500] }}>{fmt.date(log.timestamp)}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
      
      {/* ========== MODALS ========== */}
      
      {/* 2FA Setup Modal */}
      {showSetup2FA && twoFASecret && (
        <ModalOverlay onClose={() => setShowSetup2FA(false)} maxWidth={480}>
          <Card padding={0}>
            <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}` }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Set Up Two-Factor Authentication</h2>
            </div>
            <div style={{ padding: 20 }}>
              <ol style={{ margin: 0, padding: '0 0 0 20px', color: c.gray[400], fontSize: 13, lineHeight: 2 }}>
                <li>Download an authenticator app (Google Authenticator, Authy, 1Password)</li>
                <li>Scan the QR code or enter the secret key manually</li>
                <li>Enter the 6-digit code from your app to verify</li>
              </ol>
              
              <div style={{ margin: '20px 0', padding: 20, background: '#fff', borderRadius: r.lg, textAlign: 'center' }}>
                <div style={{ width: 150, height: 150, background: c.gray[200], margin: '0 auto', borderRadius: r.md, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12, color: c.gray[600] }}>[QR Code]</span>
                </div>
              </div>
              
              <div style={{ padding: 12, background: c.gray[850], borderRadius: r.md, marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: c.gray[500], marginBottom: 4 }}>Manual entry key:</p>
                <p style={{ fontSize: 14, fontFamily: tokens.font.mono, color: c.gray[200], letterSpacing: '0.1em' }}>{twoFASecret.secret}</p>
              </div>
              
              <Input
                label="Verification Code"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ marginBottom: 20 }}
              />
              
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="secondary" style={{ flex: 1 }} onClick={() => setShowSetup2FA(false)}>Cancel</Button>
                <Button variant="gradient" style={{ flex: 1 }} onClick={handleVerify2FA} disabled={verificationCode.length !== 6}>Verify & Enable</Button>
              </div>
              
              <div style={{ marginTop: 20, padding: 14, background: c.warning.muted, borderRadius: r.md }}>
                <p style={{ fontSize: 12, color: c.warning.DEFAULT, marginBottom: 8, fontWeight: 500 }}>Save your backup codes</p>
                <p style={{ fontSize: 11, color: c.gray[400], marginBottom: 8 }}>Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {twoFASecret.backupCodes.map((code, i) => (
                    <span key={i} style={{ padding: '4px 8px', background: c.gray[900], borderRadius: r.sm, fontSize: 11, fontFamily: tokens.font.mono, color: c.gray[300] }}>{code}</span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </ModalOverlay>
      )}
      
      {/* Export Data Modal */}
      {showExportModal && (
        <ModalOverlay onClose={() => !isExporting && setShowExportModal(false)} maxWidth={480}>
          <Card padding={0}>
            <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}` }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Export Your Data</h2>
            </div>
            <div style={{ padding: 20 }}>
              {!isExporting ? (
                <>
                  <p style={{ fontSize: 13, color: c.gray[400], marginBottom: 16, lineHeight: 1.6 }}>
                    We'll prepare a downloadable file containing all your data including:
                  </p>
                  <ul style={{ margin: '0 0 20px 0', padding: '0 0 0 20px', color: c.gray[300], fontSize: 13, lineHeight: 1.8 }}>
                    <li>Profile information</li>
                    <li>Lead data and notes</li>
                    <li>Sequence configurations</li>
                    <li>Communication history</li>
                    <li>Consent records</li>
                    <li>Activity logs</li>
                  </ul>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button variant="secondary" style={{ flex: 1 }} onClick={() => setShowExportModal(false)}>Cancel</Button>
                    <Button variant="gradient" style={{ flex: 1 }} onClick={handleExportUserData}>Start Export</Button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <RefreshCw size={40} style={{ color: c.primary.DEFAULT, marginBottom: 16, animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: 14, color: c.gray[200], marginBottom: 12 }}>Preparing your data export...</p>
                  <div style={{ height: 8, background: c.gray[800], borderRadius: r.full, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: `${exportProgress}%`, height: '100%', background: tokens.gradients.brand, transition: 'width 200ms ease' }} />
                  </div>
                  <p style={{ fontSize: 12, color: c.gray[500] }}>{exportProgress}% complete</p>
                </div>
              )}
            </div>
          </Card>
        </ModalOverlay>
      )}
      
      {/* Change Password Modal */}
      {showChangePassword && (
        <ModalOverlay onClose={() => { setShowChangePassword(false); setPasswordError(''); setPasswordSuccess(false); }} maxWidth={440}>
          <Card padding={0}>
            <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}` }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>Change Password</h2>
            </div>
            <div style={{ padding: 20 }}>
              {passwordSuccess ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <CheckCircle2 size={48} style={{ color: c.success.DEFAULT, marginBottom: 16 }} />
                  <p style={{ fontSize: 16, fontWeight: 500, color: c.gray[100] }}>Password Changed Successfully!</p>
                  <p style={{ fontSize: 13, color: c.gray[400], marginTop: 8 }}>Your password has been updated.</p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 6 }}>Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      placeholder="Enter current password"
                      style={{ width: '100%', padding: '10px 14px', background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], fontSize: 14, outline: 'none' }}
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 6 }}>New Password</label>
                    <input
                      type="password"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      placeholder="Enter new password"
                      style={{ width: '100%', padding: '10px 14px', background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], fontSize: 14, outline: 'none' }}
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 6 }}>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      placeholder="Confirm new password"
                      style={{ width: '100%', padding: '10px 14px', background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], fontSize: 14, outline: 'none' }}
                    />
                  </div>
                  
                  {passwordError && (
                    <div style={{ padding: 12, background: c.error.muted, borderRadius: r.md, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={16} style={{ color: c.error.DEFAULT }} />
                      <p style={{ fontSize: 13, color: c.error.DEFAULT }}>{passwordError}</p>
                    </div>
                  )}
                  
                  <div style={{ padding: 12, background: c.gray[850], borderRadius: r.md, marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: c.gray[400], marginBottom: 8 }}>Password Requirements:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {[
                        { label: '12+ characters', met: passwordForm.new.length >= 12 },
                        { label: 'Uppercase letter', met: /[A-Z]/.test(passwordForm.new) },
                        { label: 'Lowercase letter', met: /[a-z]/.test(passwordForm.new) },
                        { label: 'Number', met: /\d/.test(passwordForm.new) },
                        { label: 'Special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.new) },
                        { label: 'Passwords match', met: passwordForm.new && passwordForm.new === passwordForm.confirm },
                      ].map((req, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {req.met ? (
                            <CheckCircle2 size={12} style={{ color: c.success.DEFAULT }} />
                          ) : (
                            <div style={{ width: 12, height: 12, borderRadius: '50%', border: `1px solid ${c.gray[600]}` }} />
                          )}
                          <span style={{ fontSize: 11, color: req.met ? c.success.DEFAULT : c.gray[500] }}>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button variant="secondary" style={{ flex: 1 }} onClick={() => { setShowChangePassword(false); setPasswordError(''); }}>Cancel</Button>
                    <Button variant="gradient" style={{ flex: 1 }} onClick={handleChangePassword}>Change Password</Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </ModalOverlay>
      )}
      
      {/* Delete Data Modal */}
      {showDeleteModal && (
        <ModalOverlay onClose={() => setShowDeleteModal(false)} maxWidth={480}>
          <Card padding={0}>
            <div style={{ padding: 20, borderBottom: `1px solid ${c.gray[800]}`, background: c.error.muted }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: c.error.DEFAULT, fontFamily: tokens.font.heading }}>⚠️ Delete All Data</h2>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13, color: c.gray[300], marginBottom: 16, lineHeight: 1.6 }}>
                This action is <strong>permanent and cannot be undone</strong>. All your data will be permanently deleted including:
              </p>
              <ul style={{ margin: '0 0 20px 0', padding: '0 0 0 20px', color: c.gray[400], fontSize: 13, lineHeight: 1.8 }}>
                <li>Account information</li>
                <li>All lead data</li>
                <li>Sequences and automation rules</li>
                <li>Integration configurations</li>
                <li>Communication history</li>
              </ul>
              
              <p style={{ fontSize: 12, color: c.gray[500], marginBottom: 8 }}>
                Type <strong style={{ color: c.error.DEFAULT }}>DELETE MY DATA</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE MY DATA"
                style={{ width: '100%', padding: '10px 14px', background: c.gray[850], border: `1px solid ${c.error.DEFAULT}30`, borderRadius: r.md, color: c.gray[100], fontSize: 14, marginBottom: 20 }}
              />
              
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="secondary" style={{ flex: 1 }} onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}>Cancel</Button>
                <Button 
                  variant="primary" 
                  style={{ flex: 1, background: c.error.DEFAULT, borderColor: c.error.DEFAULT }} 
                  onClick={handleDeleteData}
                  disabled={deleteConfirmText !== 'DELETE MY DATA'}
                >
                  Permanently Delete
                </Button>
              </div>
            </div>
          </Card>
        </ModalOverlay>
      )}
    </div>
  );
};

// ============================================================================
// SETTINGS PAGE - Comprehensive with Search, Notifications & User Roles
// ============================================================================
const SettingsPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settingsSearch, setSettingsSearch] = useState('');
  
  // Notification Settings State
  const [notifications, setNotifications] = useState({
    // Email Notifications
    email: {
      newLead: true,
      leadScoreChange: true,
      sequenceComplete: true,
      dailyDigest: true,
      weeklyReport: true,
      complianceAlerts: true,
      integrationErrors: false,
      teamActivity: false,
    },
    // SMS Notifications
    sms: {
      hotLeadAlert: true,
      sequenceReply: true,
      meetingBooked: true,
      urgentOnly: false,
    },
    // In-App Notifications
    inApp: {
      allActivity: true,
      mentionsOnly: false,
    },
  });
  
  // User Roles State
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Chris Garcia', email: 'chris@azimontgroup.com', role: 'owner', avatar: 'CG', status: 'active', lastActive: '2025-01-27' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@azimontgroup.com', role: 'admin', avatar: 'SJ', status: 'active', lastActive: '2025-01-26' },
    { id: 3, name: 'Mike Davis', email: 'mike@azimontgroup.com', role: 'member', avatar: 'MD', status: 'active', lastActive: '2025-01-25' },
    { id: 4, name: 'Lisa Chen', email: 'lisa@azimontgroup.com', role: 'viewer', avatar: 'LC', status: 'invited', lastActive: null },
  ]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  
  // Enhanced Profile State
  const [profile, setProfile] = useState({
    name: user.name || 'User',
    email: user.email || 'user@example.com',
    company: user.company || '',
    phone: '',
    timezone: 'America/New_York',
    // New fields
    jobTitle: '',
    department: '',
    location: '',
    linkedIn: '',
    bio: '',
    avatar: null,
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
  });
  
  // All searchable settings items for fuzzy search
  const allSettings = useMemo(() => [
    { id: 'profile', label: 'Profile Settings', description: 'Name, email, company, phone, timezone', tab: 'profile', keywords: ['name', 'email', 'avatar', 'photo', 'picture', 'personal'] },
    { id: 'job', label: 'Job Information', description: 'Title, department, location', tab: 'profile', keywords: ['job', 'title', 'department', 'work', 'position', 'location'] },
    { id: 'preferences', label: 'Preferences', description: 'Language, date format, currency', tab: 'profile', keywords: ['language', 'date', 'format', 'currency', 'locale'] },
    { id: 'email-notif', label: 'Email Notifications', description: 'Lead alerts, digests, reports', tab: 'notifications', keywords: ['email', 'alerts', 'digest', 'report', 'notification'] },
    { id: 'sms-notif', label: 'SMS Notifications', description: 'Hot leads, meetings, urgent alerts', tab: 'notifications', keywords: ['sms', 'text', 'phone', 'mobile', 'urgent'] },
    { id: 'team', label: 'Team Management', description: 'Invite users, manage roles', tab: 'team', keywords: ['team', 'invite', 'users', 'members', 'roles', 'permissions'] },
    { id: 'password', label: 'Password & Security', description: 'Change password, 2FA, sessions', tab: 'security', keywords: ['password', 'security', '2fa', 'authentication', 'sessions', 'login'] },
    { id: 'api', label: 'API Access', description: 'API keys, webhooks', tab: 'security', keywords: ['api', 'key', 'webhook', 'integration', 'developer'] },
  ], []);
  
  const filteredSettings = useMemo(() => {
    if (!settingsSearch.trim()) return [];
    return fuzzySearch(settingsSearch, allSettings, ['label', 'description', 'keywords']);
  }, [settingsSearch, allSettings]);
  
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'team', label: 'Team & Roles', icon: Users },
    { id: 'security', label: 'Security', icon: Lock },
  ];
  
  const rolePermissions = {
    owner: { label: 'Owner', color: c.primary.DEFAULT, permissions: ['Full access', 'Billing', 'Delete account', 'Manage all users'] },
    admin: { label: 'Admin', color: c.success.DEFAULT, permissions: ['Manage users', 'All leads', 'Sequences', 'Integrations', 'Compliance'] },
    member: { label: 'Member', color: c.warning.DEFAULT, permissions: ['View leads', 'Run sequences', 'AI Assistant', 'Export data'] },
    viewer: { label: 'Viewer', color: c.gray[500], permissions: ['View leads', 'View reports', 'Read-only access'] },
  };
  
  const handleNotificationChange = (category, key) => {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key],
      },
    }));
  };
  
  const handleInviteUser = () => {
    if (inviteEmail.trim()) {
      const newMember = {
        id: Date.now(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        avatar: inviteEmail.substring(0, 2).toUpperCase(),
        status: 'invited',
        lastActive: null,
      };
      setTeamMembers(prev => [...prev, newMember]);
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteModal(false);
    }
  };
  
  const handleRoleChange = (memberId, newRole) => {
    setTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
  };
  
  const handleRemoveMember = (memberId) => {
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
  };
  
  const NotificationToggle = ({ label, description, checked, onChange }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${c.gray[850]}` }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, color: c.gray[200], marginBottom: 2 }}>{label}</p>
        {description && <p style={{ fontSize: 12, color: c.gray[500] }}>{description}</p>}
      </div>
      <button
        onClick={onChange}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: checked ? c.primary.DEFAULT : c.gray[700],
          position: 'relative', transition: tokens.transition.fast,
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: checked ? 22 : 2,
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          transition: tokens.transition.fast,
        }} />
      </button>
    </div>
  );
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header with Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: c.gray[100], marginBottom: 4, fontFamily: tokens.font.heading }}>Settings</h1>
          <p style={{ fontSize: 14, color: c.gray[500] }}>Manage your account, notifications, and team</p>
        </div>
        
        {/* Settings Search */}
        <div style={{ position: 'relative', width: 280 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.gray[500] }} />
          <input
            placeholder="Search settings..."
            value={settingsSearch}
            onChange={(e) => setSettingsSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 40px', fontSize: 14, color: c.gray[100],
              background: c.gray[900], border: `1px solid ${c.gray[800]}`, borderRadius: r.lg, outline: 'none',
            }}
          />
          
          {/* Search Results Dropdown */}
          {filteredSettings.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8,
              background: c.gray[900], border: `1px solid ${c.gray[700]}`, borderRadius: r.lg,
              boxShadow: tokens.shadow.lg, overflow: 'hidden', zIndex: 100,
            }}>
              {filteredSettings.map(setting => (
                <button
                  key={setting.id}
                  onClick={() => { setActiveTab(setting.tab); setSettingsSearch(''); }}
                  style={{
                    width: '100%', display: 'flex', flexDirection: 'column', gap: 2,
                    padding: '12px 14px', background: 'transparent', border: 'none',
                    textAlign: 'left', cursor: 'pointer', transition: tokens.transition.fast,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = c.gray[850]}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 14, color: c.gray[200], fontWeight: 500 }}>{setting.label}</span>
                  <span style={{ fontSize: 12, color: c.gray[500] }}>{setting.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* User Profile Card with Org Avatar */}
      <Card style={{ background: tokens.gradients.brandSubtle }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <UserOrgAvatar userName={profile.name} orgName={profile.company} userSize={56} />
          <div style={{ flex: 1, marginLeft: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: c.gray[100], fontFamily: tokens.font.heading }}>{profile.name}</h2>
            <p style={{ fontSize: 14, color: c.gray[400] }}>{profile.email}</p>
            {profile.company && <p style={{ fontSize: 13, color: c.gray[500], marginTop: 2 }}>{profile.company}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ padding: '4px 10px', background: c.primary[100], borderRadius: r.full, fontSize: 12, color: c.primary.light, fontWeight: 500 }}>
              {user.role === 'admin' ? 'Administrator' : 'Client'}
            </span>
          </div>
        </div>
      </Card>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: c.gray[900], borderRadius: r.lg, width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', fontSize: 14, fontWeight: 500, border: 'none', borderRadius: r.md, cursor: 'pointer',
              color: activeTab === tab.id ? c.gray[100] : c.gray[500],
              background: activeTab === tab.id ? c.gray[800] : 'transparent',
              transition: tokens.transition.fast,
            }}>
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Profile Tab - Enhanced */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 20, fontFamily: tokens.font.heading }}>Personal Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input 
                label="Full Name" 
                value={profile.name} 
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input 
                label="Email Address" 
                value={profile.email} 
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input 
                label="Phone Number" 
                value={profile.phone} 
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
              />
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[400], marginBottom: 6 }}>Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  style={{
                    width: '100%', padding: '11px 12px', fontSize: 14, color: c.gray[100],
                    background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md,
                    outline: 'none', resize: 'vertical', fontFamily: tokens.font.sans,
                  }}
                />
              </div>
            </div>
          </Card>
          
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 20, fontFamily: tokens.font.heading }}>Work Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input 
                label="Company" 
                value={profile.company} 
                onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
              />
              <Input 
                label="Job Title" 
                value={profile.jobTitle} 
                onChange={(e) => setProfile(prev => ({ ...prev, jobTitle: e.target.value }))}
                placeholder="e.g., Sales Manager"
              />
              <Input 
                label="Department" 
                value={profile.department} 
                onChange={(e) => setProfile(prev => ({ ...prev, department: e.target.value }))}
                placeholder="e.g., Sales"
              />
              <Input 
                label="Location" 
                value={profile.location} 
                onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, Country"
              />
              <Input 
                label="LinkedIn Profile" 
                value={profile.linkedIn} 
                onChange={(e) => setProfile(prev => ({ ...prev, linkedIn: e.target.value }))}
                placeholder="https://linkedin.com/in/username"
                icon={Linkedin}
              />
            </div>
          </Card>
          
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 20, fontFamily: tokens.font.heading }}>Preferences</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[400], marginBottom: 6 }}>Timezone</label>
                <select
                  value={profile.timezone}
                  onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                  style={{ width: '100%', padding: '11px 12px', fontSize: 14, color: c.gray[100], background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, outline: 'none' }}
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[400], marginBottom: 6 }}>Language</label>
                <select
                  value={profile.language}
                  onChange={(e) => setProfile(prev => ({ ...prev, language: e.target.value }))}
                  style={{ width: '100%', padding: '11px 12px', fontSize: 14, color: c.gray[100], background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, outline: 'none' }}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[400], marginBottom: 6 }}>Date Format</label>
                <select
                  value={profile.dateFormat}
                  onChange={(e) => setProfile(prev => ({ ...prev, dateFormat: e.target.value }))}
                  style={{ width: '100%', padding: '11px 12px', fontSize: 14, color: c.gray[100], background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, outline: 'none' }}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[400], marginBottom: 6 }}>Currency</label>
                <select
                  value={profile.currency}
                  onChange={(e) => setProfile(prev => ({ ...prev, currency: e.target.value }))}
                  style={{ width: '100%', padding: '11px 12px', fontSize: 14, color: c.gray[100], background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, outline: 'none' }}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
              </div>
            </div>
          </Card>
          
          {/* Account Status Card */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 20, fontFamily: tokens.font.heading }}>Account Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${c.gray[850]}` }}>
                <span style={{ fontSize: 14, color: c.gray[400] }}>Plan</span>
                <span style={{ fontSize: 14, color: c.primary.light, fontWeight: 500 }}>Professional</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${c.gray[850]}` }}>
                <span style={{ fontSize: 14, color: c.gray[400] }}>Role</span>
                <span style={{ fontSize: 14, color: c.gray[200], fontWeight: 500 }}>{user.role === 'admin' ? 'Administrator' : 'Client'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${c.gray[850]}` }}>
                <span style={{ fontSize: 14, color: c.gray[400] }}>Member Since</span>
                <span style={{ fontSize: 14, color: c.gray[200] }}>January 2025</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ fontSize: 14, color: c.gray[400] }}>Version</span>
                <span style={{ fontSize: 14, color: c.gray[500] }}>{CONFIG.version}</span>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <Button variant="primary" fullWidth>Save Changes</Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Email Notifications */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Mail size={20} style={{ color: c.primary.DEFAULT }} />
              <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100] }}>Email Notifications</h3>
            </div>
            <NotificationToggle 
              label="New Lead Alerts"
              description="Get notified when new leads are added"
              checked={notifications.email.newLead}
              onChange={() => handleNotificationChange('email', 'newLead')}
            />
            <NotificationToggle 
              label="Lead Score Changes"
              description="When a lead moves to Hot status"
              checked={notifications.email.leadScoreChange}
              onChange={() => handleNotificationChange('email', 'leadScoreChange')}
            />
            <NotificationToggle 
              label="Sequence Completions"
              description="When a lead finishes a sequence"
              checked={notifications.email.sequenceComplete}
              onChange={() => handleNotificationChange('email', 'sequenceComplete')}
            />
            <NotificationToggle 
              label="Daily Digest"
              description="Summary of daily activity at 9 AM"
              checked={notifications.email.dailyDigest}
              onChange={() => handleNotificationChange('email', 'dailyDigest')}
            />
            <NotificationToggle 
              label="Weekly Performance Report"
              description="Detailed analytics every Monday"
              checked={notifications.email.weeklyReport}
              onChange={() => handleNotificationChange('email', 'weeklyReport')}
            />
            <NotificationToggle 
              label="Compliance Alerts"
              description="DNC violations, consent expirations"
              checked={notifications.email.complianceAlerts}
              onChange={() => handleNotificationChange('email', 'complianceAlerts')}
            />
            <NotificationToggle 
              label="Integration Errors"
              description="CRM sync failures, API issues"
              checked={notifications.email.integrationErrors}
              onChange={() => handleNotificationChange('email', 'integrationErrors')}
            />
            <NotificationToggle 
              label="Team Activity"
              description="Actions by team members"
              checked={notifications.email.teamActivity}
              onChange={() => handleNotificationChange('email', 'teamActivity')}
            />
          </Card>
          
          {/* SMS Notifications */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <MessageSquare size={20} style={{ color: c.success.DEFAULT }} />
              <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100] }}>SMS Notifications</h3>
            </div>
            <p style={{ fontSize: 12, color: c.gray[500], marginBottom: 16 }}>
              Receive critical alerts via text message. Standard rates may apply.
            </p>
            <NotificationToggle 
              label="Hot Lead Alerts"
              description="Instant SMS when a lead becomes hot"
              checked={notifications.sms.hotLeadAlert}
              onChange={() => handleNotificationChange('sms', 'hotLeadAlert')}
            />
            <NotificationToggle 
              label="Sequence Replies"
              description="When a lead responds to outreach"
              checked={notifications.sms.sequenceReply}
              onChange={() => handleNotificationChange('sms', 'sequenceReply')}
            />
            <NotificationToggle 
              label="Meeting Booked"
              description="When a lead schedules a meeting"
              checked={notifications.sms.meetingBooked}
              onChange={() => handleNotificationChange('sms', 'meetingBooked')}
            />
            <NotificationToggle 
              label="Urgent Only Mode"
              description="Only receive critical alerts"
              checked={notifications.sms.urgentOnly}
              onChange={() => handleNotificationChange('sms', 'urgentOnly')}
            />
            
            <div style={{ marginTop: 16, padding: 12, background: c.gray[850], borderRadius: r.lg }}>
              <p style={{ fontSize: 13, color: c.gray[400], marginBottom: 8 }}>SMS Phone Number</p>
              <Input placeholder="+1 (555) 000-0000" />
            </div>
          </Card>
          
          {/* Quick Settings */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Settings size={20} style={{ color: c.warning.DEFAULT }} />
              <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100] }}>Quick Settings</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button 
                onClick={() => setNotifications(prev => ({
                  email: Object.fromEntries(Object.keys(prev.email).map(k => [k, true])),
                  sms: Object.fromEntries(Object.keys(prev.sms).map(k => [k, true])),
                  inApp: prev.inApp,
                }))}
                style={{ padding: '12px 16px', background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.lg, textAlign: 'left', cursor: 'pointer' }}
              >
                <p style={{ fontSize: 14, color: c.gray[200] }}>Enable All Notifications</p>
                <p style={{ fontSize: 12, color: c.gray[500] }}>Turn on all email and SMS alerts</p>
              </button>
              <button 
                onClick={() => setNotifications(prev => ({
                  email: Object.fromEntries(Object.keys(prev.email).map(k => [k, false])),
                  sms: Object.fromEntries(Object.keys(prev.sms).map(k => [k, false])),
                  inApp: prev.inApp,
                }))}
                style={{ padding: '12px 16px', background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.lg, textAlign: 'left', cursor: 'pointer' }}
              >
                <p style={{ fontSize: 14, color: c.gray[200] }}>Mute All Notifications</p>
                <p style={{ fontSize: 12, color: c.gray[500] }}>Temporarily disable all alerts</p>
              </button>
              <button 
                onClick={() => setNotifications({
                  email: { newLead: true, leadScoreChange: true, sequenceComplete: false, dailyDigest: true, weeklyReport: true, complianceAlerts: true, integrationErrors: false, teamActivity: false },
                  sms: { hotLeadAlert: true, sequenceReply: true, meetingBooked: true, urgentOnly: false },
                  inApp: { allActivity: true, mentionsOnly: false },
                })}
                style={{ padding: '12px 16px', background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.lg, textAlign: 'left', cursor: 'pointer' }}
              >
                <p style={{ fontSize: 14, color: c.gray[200] }}>Reset to Defaults</p>
                <p style={{ fontSize: 12, color: c.gray[500] }}>Restore recommended settings</p>
              </button>
            </div>
          </Card>
        </div>
      )}
      
      {activeTab === 'team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100] }}>Team Members</h3>
                <p style={{ fontSize: 13, color: c.gray[500] }}>{teamMembers.length} members in your organization</p>
              </div>
              <Button icon={Plus} onClick={() => setShowInviteModal(true)}>Invite Member</Button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Member', 'Role', 'Status', 'Last Active', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: c.gray[500], textTransform: 'uppercase', borderBottom: `1px solid ${c.gray[800]}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map(member => (
                    <tr key={member.id}>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={member.name} size={36} />
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 500, color: c.gray[100] }}>{member.name}</p>
                            <p style={{ fontSize: 12, color: c.gray[500] }}>{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}` }}>
                        {member.role === 'owner' ? (
                          <span style={{ padding: '4px 10px', borderRadius: r.full, fontSize: 12, background: `${rolePermissions[member.role].color}20`, color: rolePermissions[member.role].color }}>
                            {rolePermissions[member.role].label}
                          </span>
                        ) : (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            style={{ padding: '6px 10px', fontSize: 12, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[300], outline: 'none' }}
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        )}
                      </td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}` }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: r.full, fontSize: 11,
                          background: member.status === 'active' ? c.success.muted : c.warning.muted,
                          color: member.status === 'active' ? c.success.DEFAULT : c.warning.DEFAULT,
                          textTransform: 'capitalize'
                        }}>
                          {member.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}`, fontSize: 13, color: c.gray[500] }}>
                        {member.lastActive || 'Pending'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${c.gray[850]}` }}>
                        {member.role !== 'owner' && (
                          <button 
                            onClick={() => handleRemoveMember(member.id)}
                            style={{ padding: '4px 10px', fontSize: 12, background: c.error.muted, border: 'none', borderRadius: r.md, color: c.error.DEFAULT, cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          
          {/* Role Permissions */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 16 }}>Role Permissions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {Object.entries(rolePermissions).map(([role, info]) => (
                <div key={role} style={{ padding: 16, background: c.gray[850], borderRadius: r.lg, border: `1px solid ${c.gray[800]}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: info.color }} />
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: c.gray[200] }}>{info.label}</h4>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {info.permissions.map((perm, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.gray[400] }}>
                        <Check size={12} style={{ color: info.color }} />
                        {perm}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      
      {activeTab === 'security' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 20 }}>Change Password</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Current Password" type="password" placeholder="Enter current password" />
              <Input label="New Password" type="password" placeholder="Enter new password" />
              <Input label="Confirm New Password" type="password" placeholder="Confirm new password" />
              <Button style={{ marginTop: 8 }}>Update Password</Button>
            </div>
          </Card>
          
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 20 }}>Two-Factor Authentication</h3>
            <div style={{ padding: 16, background: c.gray[850], borderRadius: r.lg, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: r.md, background: c.gray[800], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={20} style={{ color: c.gray[500] }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, color: c.gray[200] }}>2FA Status</p>
                  <p style={{ fontSize: 12, color: c.gray[500] }}>Add an extra layer of security</p>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: r.full, fontSize: 11, background: c.warning.muted, color: c.warning.DEFAULT }}>
                  Not Enabled
                </span>
              </div>
            </div>
            <Button variant="secondary" fullWidth>Enable Two-Factor Authentication</Button>
          </Card>
          
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 20 }}>Active Sessions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: 12, background: c.gray[850], borderRadius: r.lg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 14, color: c.gray[200] }}>Current Session</p>
                  <p style={{ fontSize: 12, color: c.gray[500] }}>Chrome on Windows • Charlotte, NC</p>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: r.full, fontSize: 11, background: c.success.muted, color: c.success.DEFAULT }}>
                  Active
                </span>
              </div>
            </div>
            <Button variant="secondary" fullWidth style={{ marginTop: 16 }}>Sign Out All Other Sessions</Button>
          </Card>
          
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.gray[100], marginBottom: 20 }}>Danger Zone</h3>
            <div style={{ padding: 16, background: `${c.error.DEFAULT}10`, borderRadius: r.lg, border: `1px solid ${c.error.DEFAULT}30` }}>
              <p style={{ fontSize: 14, color: c.error.DEFAULT, marginBottom: 8 }}>Delete Account</p>
              <p style={{ fontSize: 12, color: c.gray[500], marginBottom: 12 }}>
                Once you delete your account, there is no going back. All your data will be permanently removed.
              </p>
              <Button 
                variant="secondary" 
                style={{ background: c.error.muted, color: c.error.DEFAULT, border: `1px solid ${c.error.DEFAULT}50` }}
              >
                Delete Account
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {showInviteModal && (
        <div onClick={() => setShowInviteModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 }}>
          <Card onClick={(e) => e.stopPropagation()} padding={24} style={{ width: '100%', maxWidth: 420 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: c.gray[100], marginBottom: 16 }}>Invite Team Member</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input 
                label="Email Address" 
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
              />
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.gray[300], marginBottom: 6 }}>Role</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: c.gray[850], border: `1px solid ${c.gray[700]}`, borderRadius: r.md, color: c.gray[100], outline: 'none' }}
                >
                  <option value="admin">Admin - Full access except billing</option>
                  <option value="member">Member - Standard access</option>
                  <option value="viewer">Viewer - Read-only access</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <Button variant="secondary" style={{ flex: 1 }} onClick={() => setShowInviteModal(false)}>Cancel</Button>
                <Button style={{ flex: 1 }} onClick={handleInviteUser}>Send Invite</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  
  if (!user) return <ErrorBoundary><LoginPage onLogin={setUser} /></ErrorBoundary>;
  
  const titles = { 
    dashboard: 'Dashboard', 
    clients: 'Clients', 
    upload: 'Import', 
    analytics: 'Analytics', 
    leads: 'Leads', 
    sequences: 'Sequences',
    calendar: 'Calendar',
    'ai-insights': 'AI Assistant', 
    integrations: 'Integrations',
    compliance: 'Compliance',
    security: 'Security Center',
    help: 'Help Center',
    settings: 'Settings' 
  };
  
  const renderPage = () => {
    if (user.role === 'admin') {
      switch (page) {
        case 'clients': return <AdminClients />;
        case 'upload': return <AdminUpload />;
        case 'security': return <SecurityCenterPage user={user} />;
        case 'settings': return <SettingsPage user={user} />;
        default: return <Dashboard user={user} />;
      }
    }
    switch (page) {
      case 'leads': return <LeadsPage user={user} highlightLead={selectedLead} />;
      case 'sequences': return <SequencesPage user={user} />;
      case 'calendar': return <CalendarPage user={user} />;
      case 'ai-insights': return <AIAssistant user={user} />;
      case 'integrations': return <IntegrationsPage user={user} />;
      case 'compliance': return <CompliancePage user={user} />;
      case 'security': return <SecurityCenterPage user={user} />;
      case 'help': return <HelpPage user={user} />;
      case 'settings': return <SettingsPage user={user} />;
      default: return <Dashboard user={user} />;
    }
  };

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={{ user, logout: () => setUser(null) }}>
        <div style={{ display: 'flex', minHeight: '100vh', background: c.gray[950], position: 'relative' }}>
          {/* Background gradient effects */}
          <div style={{ position: 'fixed', inset: 0, background: tokens.gradients.blueRadial, pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '40%', background: tokens.gradients.orangeGlow, pointerEvents: 'none', zIndex: 0 }} />
          
          <Sidebar user={user} currentPage={page} setCurrentPage={setPage} onLogout={() => setUser(null)} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative', zIndex: 1 }} className="main-content">
            <Header title={titles[page]} user={user} onMenuClick={() => setSidebarOpen(true)} onNavigate={setPage} onSelectLead={(lead) => { setSelectedLead(lead); setTimeout(() => setSelectedLead(null), 3000); }} />
            
            <main className="scroll-container" style={{ flex: 1, padding: 24, overflowY: 'auto', minHeight: 0 }}>
              <ErrorBoundary>{renderPage()}</ErrorBoundary>
            </main>
          </div>
        </div>
      </AuthContext.Provider>
      
      {/* Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800&family=Montserrat:wght@300;400;500;600;700&display=swap');
        @keyframes pulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(242, 76, 3, 0.3); } 50% { box-shadow: 0 0 30px rgba(49, 72, 185, 0.4); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .animate-glow { animation: glow 3s ease-in-out infinite; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; overflow: hidden; }
        body { font-family: 'Montserrat', ${tokens.font.sans}; -webkit-font-smoothing: antialiased; background: ${c.gray[950]}; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Raleway', ${tokens.font.heading}; }
        ::selection { background: rgba(49, 72, 185, 0.4); color: #fff; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${c.gray[900]}; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, ${c.primary.DEFAULT} 0%, ${c.accent.DEFAULT} 100%); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${c.primary.hover}; }
        
        .sidebar { transform: translateX(0) !important; }
        .main-content { margin-left: 256px; }
        .lg-hidden { display: none !important; }
        .search-desktop { display: block; }
        .user-desktop { display: flex; }
        .ai-sidebar { display: flex; }
        
        /* Scroll container fix */
        .scroll-container {
          overflow-y: auto !important;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          min-height: 0;
        }
        
        /* Fix for flex children to allow scrolling */
        .scroll-container > div {
          min-height: min-content;
        }
        
        @media (max-width: 1024px) {
          .sidebar { transform: translateX(-100%) !important; }
          .main-content { margin-left: 0 !important; }
          .lg-hidden { display: block !important; }
          .search-desktop { display: none !important; }
          .user-desktop { display: none !important; }
          .ai-sidebar { display: none !important; }
        }
      `}</style>
    </ErrorBoundary>
  );
}
