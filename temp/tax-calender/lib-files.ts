// lib/db.ts - Database connection and query utilities
import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query(text: string, params?: any[]): Promise<any> {
  const start = Date.now();
  let client: PoolClient | null = null;
  
  try {
    client = await pool.connect();
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.DATABASE_DEBUG === 'true') {
      console.log('Executed query', { 
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), 
        duration, 
        rows: res.rowCount 
      });
    }
    
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Health check function
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health');
    return result.rows.length === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// lib/auth.ts - Authentication utilities
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from './db';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = '7d';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  teamMemberships?: TeamMembership[];
}

export interface TeamMembership {
  teamId: string;
  role: string;
  teamName: string;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export async function createUser(email: string, password: string, name: string): Promise<User> {
  const hashedPassword = await hashPassword(password);
  
  const result = await query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
    [email, hashedPassword, name]
  );
  
  return result.rows[0];
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const result = await query(
    'SELECT id, email, name, password_hash FROM users WHERE email = $1',
    [email]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  const isValidPassword = await verifyPassword(password, user.password_hash);
  
  if (!isValidPassword) {
    return null;
  }
  
  // Get user's team memberships
  const memberships = await query(`
    SELECT tm.team_id, tm.role, t.name as team_name 
    FROM team_members tm 
    JOIN teams t ON tm.team_id = t.id 
    WHERE tm.user_id = $1
  `, [user.id]);
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    return {
    id: user.id,
    email: user.email,
    name: user.name,
    teamMemberships: memberships.rows.map((row: any) => ({
      teamId: row.team_id,
      role: row.role,
      teamName: row.team_name
    }))
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await query(
    'SELECT id, email, name FROM users WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  
  // Get user's team memberships
  const memberships = await query(`
    SELECT tm.team_id, tm.role, t.name as team_name 
    FROM team_members tm 
    JOIN teams t ON tm.team_id = t.id 
    WHERE tm.user_id = $1
  `, [user.id]);
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    teamMemberships: memberships.rows.map((row: any) => ({
      teamId: row.team_id,
      role: row.role,
      teamName: row.team_name
    }))
  };
}

export async function checkTeamPermission(userId: string, teamId: string, requiredRoles: string[] = []): Promise<{ hasAccess: boolean; role?: string }> {
  const result = await query(
    'SELECT role FROM team_members WHERE user_id = $1 AND team_id = $2',
    [userId, teamId]
  );
  
  if (result.rows.length === 0) {
    return { hasAccess: false };
  }
  
  const userRole = result.rows[0].role;
  const hasAccess = requiredRoles.length === 0 || requiredRoles.includes(userRole);
  
  return { hasAccess, role: userRole };
}

// lib/audit.ts - Audit logging utilities
import { query } from './db';

export interface AuditLogEntry {
  id?: string;
  actor: string;
  action: string;
  resource?: string;
  teamId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  timestamp?: Date;
}

export async function logAudit(
  actor: string,
  action: string,
  resource?: string,
  metadata?: Record<string, any>,
  options?: {
    teamId?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }
): Promise<string> {
  try {
    const result = await query(`
      INSERT INTO audit_logs (
        actor, action, resource, team_id, metadata, 
        ip_address, user_agent, session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING id
    `, [
      actor,
      action,
      resource || null,
      options?.teamId || null,
      JSON.stringify(metadata || {}),
      options?.ipAddress || null,
      options?.userAgent || null,
      options?.sessionId || null
    ]);
    
    return result.rows[0].id;
  } catch (error) {
    console.error('Failed to log audit entry:', error);
    throw error;
  }
}

export async function getAuditLogs(
  filters: {
    actor?: string;
    action?: string;
    resource?: string;
    teamId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ logs: AuditLogEntry[]; total: number }> {
  const conditions = [];
  const params = [];
  let paramIndex = 1;
  
  if (filters.actor) {
    conditions.push(`actor = ${paramIndex++}`);
    params.push(filters.actor);
  }
  
  if (filters.action) {
    conditions.push(`action = ${paramIndex++}`);
    params.push(filters.action);
  }
  
  if (filters.resource) {
    conditions.push(`resource = ${paramIndex++}`);
    params.push(filters.resource);
  }
  
  if (filters.teamId) {
    conditions.push(`team_id = ${paramIndex++}`);
    params.push(filters.teamId);
  }
  
  if (filters.dateFrom) {
    conditions.push(`created_at >= ${paramIndex++}`);
    params.push(filters.dateFrom);
  }
  
  if (filters.dateTo) {
    conditions.push(`created_at <= ${paramIndex++}`);
    params.push(filters.dateTo);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  
  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
    params
  );
  
  // Get logs with pagination
  const logsResult = await query(`
    SELECT * FROM audit_logs ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${paramIndex++} OFFSET ${paramIndex}
  `, [...params, limit, offset]);
  
  return {
    logs: logsResult.rows,
    total: parseInt(countResult.rows[0].total)
  };
}

// lib/blockchain.ts - Blockchain timestamping utilities
import crypto from 'crypto';

export interface BlockchainRecord {
  hash: string;
  timestamp: string;
  data: any;
  previousHash?: string;
}

// Mock blockchain implementation for demonstration
// In production, this would integrate with a real blockchain service
class MockBlockchain {
  private chain: BlockchainRecord[] = [];
  
  constructor() {
    // Create genesis block
    this.chain.push({
      hash: this.calculateHash('0', new Date().toISOString(), { genesis: true }),
      timestamp: new Date().toISOString(),
      data: { genesis: true }
    });
  }
  
  private calculateHash(previousHash: string, timestamp: string, data: any): string {
    return crypto
      .createHash('sha256')
      .update(previousHash + timestamp + JSON.stringify(data))
      .digest('hex');
  }
  
  addRecord(data: any): string {
    const previousBlock = this.chain[this.chain.length - 1];
    const timestamp = new Date().toISOString();
    const hash = this.calculateHash(previousBlock.hash, timestamp, data);
    
    const newRecord: BlockchainRecord = {
      hash,
      timestamp,
      data,
      previousHash: previousBlock.hash
    };
    
    this.chain.push(newRecord);
    return hash;
  }
  
  verifyRecord(hash: string): BlockchainRecord | null {
    return this.chain.find(record => record.hash === hash) || null;
  }
}

const blockchain = new MockBlockchain();

export async function recordOnChain(action: string, data: any): Promise<string> {
  try {
    const record = {
      action,
      data,
      timestamp: new Date().toISOString()
    };
    
    const hash = blockchain.addRecord(record);
    
    // In production, you might also send to external blockchain service
    // await sendToExternalBlockchain(record);
    
    return hash;
  } catch (error) {
    console.error('Blockchain recording failed:', error);
    throw error;
  }
}

export async function verifyBlockchainRecord(hash: string): Promise<BlockchainRecord | null> {
  try {
    return blockchain.verifyRecord(hash);
  } catch (error) {
    console.error('Blockchain verification failed:', error);
    return null;
  }
}

// lib/notifications.ts - Notification utilities (client-side helpers)
export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  userId?: string;
  teamId?: string;
  eventId?: string;
  metadata?: Record<string, any>;
}

export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'demo-user' // Replace with actual user ID
      },
      body: JSON.stringify(payload)
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
}

export async function markNotificationRead(notificationId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'demo-user'
      },
      body: JSON.stringify({ notificationId })
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return false;
  }
}

export async function getUserNotifications(limit = 20, offset = 0): Promise<any[]> {
  try {
    const response = await fetch(
      `/api/notifications?limit=${limit}&offset=${offset}`,
      {
        headers: { 'x-user-id': 'demo-user' }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.notifications || [];
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }
}

// lib/socketClient.ts - Socket.IO client utilities
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentTeamId: string | null = null;

export function connectSocket(serverUrl?: string, userId?: string): Socket | null {
  if (typeof window === 'undefined') return null;
  
  const url = serverUrl || process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:4000';
  
  if (!socket || !socket.connected) {
    socket = io(url, {
      transports: ['websocket'],
      auth: {
        userId: userId || 'demo-user'
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected');
      if (currentTeamId) {
        socket?.emit('joinTeam', currentTeamId);
      }
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  
  return socket;
}

export function joinTeam(teamId: string): void {
  if (!socket) return;
  
  // Leave previous team if any
  if (currentTeamId && currentTeamId !== teamId) {
    socket.emit('leaveTeam', currentTeamId);
  }
  
  // Join new team
  socket.emit('joinTeam', teamId);
  currentTeamId = teamId;
  
  console.log(`Joined team: ${teamId}`);
}

export function leaveTeam(teamId: string): void {
  if (!socket) return;
  
  socket.emit('leaveTeam', teamId);
  if (currentTeamId === teamId) {
    currentTeamId = null;
  }
  
  console.log(`Left team: ${teamId}`);
}

export function subscribeToEvents(handlers: {
  onEventCreated?: (event: any) => void;
  onEventUpdated?: (event: any) => void;
  onEventDeleted?: (event: any) => void;
  onMemberJoined?: (member: any) => void;
  onMemberLeft?: (member: any) => void;
  onRoleChanged?: (change: any) => void;
  onNotification?: (notification: any) => void;
}): void {
  if (!socket) return;
  
  // Remove existing listeners to avoid duplicates
  socket.removeAllListeners('event_created');
  socket.removeAllListeners('event_updated');
  socket.removeAllListeners('event_deleted');
  socket.removeAllListeners('member_joined');
  socket.removeAllListeners('member_left');
  socket.removeAllListeners('role_changed');
  socket.removeAllListeners('notification');
  
  // Add new listeners
  if (handlers.onEventCreated) {
    socket.on('event_created', handlers.onEventCreated);
  }
  
  if (handlers.onEventUpdated) {
    socket.on('event_updated', handlers.onEventUpdated);
  }
  
  if (handlers.onEventDeleted) {
    socket.on('event_deleted', handlers.onEventDeleted);
  }
  
  if (handlers.onMemberJoined) {
    socket.on('member_joined', handlers.onMemberJoined);
  }
  
  if (handlers.onMemberLeft) {
    socket.on('member_left', handlers.onMemberLeft);
  }
  
  if (handlers.onRoleChanged) {
    socket.on('role_changed', handlers.onRoleChanged);
  }
  
  if (handlers.onNotification) {
    socket.on('notification', handlers.onNotification);
  }
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentTeamId = null;
  }
}

// Connection status hook for React components
export function useSocketConnection(teamId?: string) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectionError, setConnectionError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const socketInstance = connectSocket();
    
    if (socketInstance) {
      socketInstance.on('connect', () => {
        setIsConnected(true);
        setConnectionError(null);
        if (teamId) {
          joinTeam(teamId);
        }
      });
      
      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });
      
      socketInstance.on('connect_error', (error) => {
        setConnectionError(error.message);
        setIsConnected(false);
      });
    }
    
    return () => {
      if (teamId) {
        leaveTeam(teamId);
      }
    };
  }, [teamId]);
  
  return { isConnected, connectionError };
}

// lib/utils.ts - General utility functions
export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString();
    case 'long':
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'time':
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    default:
      return d.toLocaleDateString();
  }
}

export function formatDateRange(startDate: Date | string, endDate?: Date | string): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  
  if (!end || start.toDateString() === end.toDateString()) {
    return formatDate(start, 'long');
  }
  
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Import React for the hook
import React from 'react';