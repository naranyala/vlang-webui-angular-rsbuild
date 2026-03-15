import { TestBed } from '@angular/core/testing';
import { UserService, User } from './user.service';
import { WebUIService } from './app/webui.service';

describe('UserService', () => {
  let service: UserService;
  let webuiMock: Partial<WebUIService>;

  beforeEach(() => {
    webuiMock = {
      call: jest.fn(),
      callAll: jest.fn(),
      connected: jest.fn(),
      port: jest.fn(),
      connectionState: jest.fn(),
      resetConnection: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: WebUIService, useValue: webuiMock },
      ],
    });

    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll()', () => {
    it('should fetch all users', async () => {
      const mockUsers: User[] = [
        { id: 1, name: 'John', email: 'john@example.com', role: 'user', status: 'active', created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: 2, name: 'Jane', email: 'jane@example.com', role: 'admin', status: 'active', created_at: '2024-01-02', updated_at: '2024-01-02' },
      ];

      (webuiMock.call as jest.Mock).mockResolvedValue(mockUsers);

      const users = await service.getAll();

      expect(webuiMock.call).toHaveBeenCalledWith('getUsers');
      expect(users).toHaveLength(2);
      expect(users[0].name).toBe('John');
    });

    it('should handle empty user list', async () => {
      (webuiMock.call as jest.Mock).mockResolvedValue([]);

      const users = await service.getAll();

      expect(users).toHaveLength(0);
    });
  });

  describe('getById()', () => {
    it('should fetch user by ID', async () => {
      const mockUser: User = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        status: 'active',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      (webuiMock.call as jest.Mock).mockResolvedValue(mockUser);

      const user = await service.getById(1);

      expect(webuiMock.call).toHaveBeenCalledWith('getUser', ['1']);
      expect(user).toEqual(mockUser);
    });
  });

  describe('save()', () => {
    it('should create new user', async () => {
      const newUser: Partial<User> = {
        name: 'New User',
        email: 'new@example.com',
        role: 'user',
        status: 'active',
      };

      const createdUser: User = {
        id: 3,
        ...newUser,
        created_at: '2024-01-15',
        updated_at: '2024-01-15',
      };

      (webuiMock.call as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.save(newUser);

      expect(webuiMock.call).toHaveBeenCalledWith('saveUser', [JSON.stringify(newUser)]);
      expect(result.id).toBe(3);
      expect(result.name).toBe('New User');
    });

    it('should update existing user', async () => {
      const updatedUser: Partial<User> = {
        id: 1,
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const resultUser: User = {
        id: 1,
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'user',
        status: 'active',
        created_at: '2024-01-01',
        updated_at: '2024-01-15',
      };

      (webuiMock.call as jest.Mock).mockResolvedValue(resultUser);

      const result = await service.save(updatedUser);

      expect(webuiMock.call).toHaveBeenCalledWith('saveUser', [JSON.stringify(updatedUser)]);
      expect(result.updated_at).toBe('2024-01-15');
    });
  });

  describe('delete()', () => {
    it('should delete user', async () => {
      (webuiMock.call as jest.Mock).mockResolvedValue(undefined);

      await service.delete(1);

      expect(webuiMock.call).toHaveBeenCalledWith('deleteUser', ['1']);
    });
  });

  describe('search()', () => {
    it('should search users by query', async () => {
      const mockUsers: User[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user', status: 'active', created_at: '2024-01-01', updated_at: '2024-01-01' },
      ];

      (webuiMock.call as jest.Mock).mockResolvedValue(mockUsers);

      const users = await service.search('john');

      expect(webuiMock.call).toHaveBeenCalledWith('searchUsers', ['john']);
      expect(users).toHaveLength(1);
    });

    it('should handle empty search results', async () => {
      (webuiMock.call as jest.Mock).mockResolvedValue([]);

      const users = await service.search('nonexistent');

      expect(users).toHaveLength(0);
    });
  });

  describe('getStats()', () => {
    it('should fetch user statistics', async () => {
      const mockStats = { total: 10, active: 7, inactive: 3 };

      (webuiMock.call as jest.Mock).mockResolvedValue(mockStats);

      const stats = await service.getStats();

      expect(webuiMock.call).toHaveBeenCalledWith('getUserStats');
      expect(stats).toEqual(mockStats);
      expect(stats.total).toBe(10);
      expect(stats.active).toBe(7);
      expect(stats.inactive).toBe(3);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from WebUIService', async () => {
      const error = new Error('Backend error');
      (webuiMock.call as jest.Mock).mockRejectedValue(error);

      await expect(service.getAll()).rejects.toThrow('Backend error');
    });
  });

  describe('User interface', () => {
    it('should have correct User type structure', () => {
      const user: User = {
        id: 1,
        name: 'Test',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      expect(user.id).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.role).toBeDefined();
      expect(user.status).toBeDefined();
    });
  });
});
