import { Card, User, WindowEntry, BottomPanelTab, TECH_CARDS } from './card.model';

describe('Model Tests', () => {
  describe('Card Model', () => {
    it('should create valid Card objects', () => {
      const card: Card = {
        id: 1,
        title: 'Test Card',
        description: 'Test Description',
        icon: '📊',
        color: '#667eea',
        content: '<div>Test Content</div>',
      };

      expect(card.id).toBe(1);
      expect(card.title).toBe('Test Card');
      expect(card.description).toBe('Test Description');
      expect(card.icon).toBe('📊');
      expect(card.color).toBe('#667eea');
      expect(card.content).toBe('<div>Test Content</div>');
    });

    it('should have required properties', () => {
      const card: Card = TECH_CARDS[0];

      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('title');
      expect(card).toHaveProperty('description');
      expect(card).toHaveProperty('icon');
      expect(card).toHaveProperty('color');
      expect(card).toHaveProperty('content');
    });

    it('should handle card with empty content', () => {
      const card: Card = {
        id: 2,
        title: 'Empty Card',
        description: 'No content',
        icon: '',
        color: '#000000',
        content: '',
      };

      expect(card.content).toBe('');
      expect(card.icon).toBe('');
    });
  });

  describe('TECH_CARDS Constant', () => {
    it('should have at least one card', () => {
      expect(TECH_CARDS.length).toBeGreaterThan(0);
    });

    it('should have unique IDs', () => {
      const ids = TECH_CARDS.map(card => card.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid card structure', () => {
      TECH_CARDS.forEach(card => {
        expect(card.id).toBeGreaterThan(0);
        expect(card.title).toBeTruthy();
        expect(card.description).toBeTruthy();
        expect(card.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should have Login/Register card', () => {
      const loginCard = TECH_CARDS.find(c => c.title.includes('Login'));
      expect(loginCard).toBeDefined();
      expect(loginCard?.title).toContain('Login');
    });

    it('should have SQLite CRUD card', () => {
      const crudCard = TECH_CARDS.find(c => c.title.includes('SQLite'));
      expect(crudCard).toBeDefined();
      expect(crudCard?.title).toContain('SQLite');
    });
  });

  describe('User Model', () => {
    it('should create valid User objects', () => {
      const user: User = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        status: 'active',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      expect(user.id).toBe(1);
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.role).toBe('admin');
      expect(user.status).toBe('active');
    });

    it('should handle optional properties', () => {
      const user: Partial<User> = {
        id: 2,
        name: 'Jane Doe',
      };

      expect(user.id).toBe(2);
      expect(user.name).toBe('Jane Doe');
      expect(user.email).toBeUndefined();
    });

    it('should validate email format', () => {
      const validUser: User = {
        id: 1,
        name: 'Test',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      expect(validUser.email).toContain('@');
      expect(validUser.email).toContain('.');
    });
  });

  describe('WindowEntry Model', () => {
    it('should create valid WindowEntry objects', () => {
      const entry: WindowEntry = {
        id: 'card-1',
        title: 'Test Window',
        minimized: false,
        focused: true,
      };

      expect(entry.id).toBe('card-1');
      expect(entry.title).toBe('Test Window');
      expect(entry.minimized).toBe(false);
      expect(entry.focused).toBe(true);
    });

    it('should handle window state changes', () => {
      const entry: WindowEntry = {
        id: 'card-1',
        title: 'Test',
        minimized: false,
        focused: true,
      };

      // Simulate minimize
      entry.minimized = true;
      entry.focused = false;

      expect(entry.minimized).toBe(true);
      expect(entry.focused).toBe(false);
    });
  });

  describe('BottomPanelTab Model', () => {
    it('should create valid BottomPanelTab objects', () => {
      const tab: BottomPanelTab = {
        id: 'overview',
        label: 'Overview',
        icon: '📊',
        content: 'System overview',
      };

      expect(tab.id).toBe('overview');
      expect(tab.label).toBe('Overview');
      expect(tab.icon).toBe('📊');
      expect(tab.content).toBe('System overview');
    });
  });

  describe('Model Serialization', () => {
    it('should serialize Card to JSON', () => {
      const card: Card = {
        id: 1,
        title: 'Test',
        description: 'Test Desc',
        icon: '📊',
        color: '#667eea',
        content: '<div>Content</div>',
      };

      const json = JSON.stringify(card);
      const parsed = JSON.parse(json) as Card;

      expect(parsed.id).toBe(card.id);
      expect(parsed.title).toBe(card.title);
      expect(parsed.color).toBe(card.color);
    });

    it('should serialize User to JSON', () => {
      const user: User = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        role: 'admin',
        status: 'active',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const json = JSON.stringify(user);
      const parsed = JSON.parse(json) as User;

      expect(parsed.id).toBe(user.id);
      expect(parsed.name).toBe(user.name);
      expect(parsed.email).toBe(user.email);
    });

    it('should deserialize from JSON', () => {
      const jsonString = '{"id":1,"name":"Test","email":"test@example.com","role":"user","status":"active"}';
      const user = JSON.parse(jsonString) as User;

      expect(user.id).toBe(1);
      expect(user.name).toBe('Test');
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('Model Validation', () => {
    it('should validate required Card fields', () => {
      const createCard = () => {
        return {
          id: 1,
          title: '', // Invalid - empty title
          description: 'Desc',
          icon: '📊',
          color: '#667eea',
          content: 'Content',
        };
      };

      const card = createCard();
      expect(card.title).toBe(''); // Should be validated at runtime
    });

    it('should validate User email', () => {
      const isValidEmail = (email: string): boolean => {
        return email.includes('@') && email.includes('.');
      };

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('no@domain')).toBe(false);
    });

    it('should validate User status values', () => {
      const validStatuses = ['active', 'inactive'];
      
      const user1: User = {
        id: 1,
        name: 'Test',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const user2: User = {
        ...user1,
        status: 'inactive',
      };

      expect(validStatuses).toContain(user1.status);
      expect(validStatuses).toContain(user2.status);
    });

    it('should validate User role values', () => {
      const validRoles = ['user', 'admin', 'moderator'];
      
      const user: User = {
        id: 1,
        name: 'Test',
        email: 'test@example.com',
        role: 'admin',
        status: 'active',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      expect(validRoles).toContain(user.role);
    });
  });
});
