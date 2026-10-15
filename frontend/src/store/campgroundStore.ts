import { create } from "zustand";
import {
  getCampgrounds,
  createCampground,
  getCampgroundById,
  updateCampground,
  deleteCampground,
} from "../api/campgrounds";
import { createReview, deleteReview } from "../api/reviews";
import type { User } from "./userStore";

export interface CampgroundImage {
  url: string;
  filename: string;
  _id?: string; // Mongoose adds an ID to subdocuments automatically
}

export interface CampgroundGeometry {
  type: "Point";
  coordinates: number[];
}

export interface Campground {
  _id: string;
  title: string;
  images: CampgroundImage[];
  geometry: CampgroundGeometry;
  location: string;
  description: string;
  price: number;
  author: User;
  reviews?: Review[];
}

export interface Review {
  _id: string;
  body: string;
  rating: number;
  author: User;
}

export interface CreateCampgroundPayload {
  title: string;
  location: string;
  images: {
    url: string;
    filename: string;
  }[];
  price: number;
  description: string;
}

export interface CreateReviewPayload {
  rating: number;
  body: string;
}

interface BackendError {
  message: string;
  details?: any[];
}

interface CampgroundStore {
  campgrounds: Campground[];
  campground: Campground | null;
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  loading: boolean;
  error: BackendError | null;
  getCampgrounds: (page?: number, search?: string) => Promise<void>;
  addCampground: (payload: CreateCampgroundPayload) => Promise<Campground>;
  getCampgroundById: (id: string) => Promise<void>;
  updateCampground: (
    id: string,
    payload: Partial<CreateCampgroundPayload>,
  ) => Promise<void>;
  deleteCampground: (id: string) => Promise<void>;
  clearError: () => void;
  addReview: (
    campgroundId: string,
    payload: CreateReviewPayload,
  ) => Promise<void>;
  deleteReview: (campgroundId: string, reviewId: string) => Promise<void>;
}

export const useCampgroundStore = create<CampgroundStore>((set) => ({
  campgrounds: [],
  campground: null,
  currentPage: 1,
  totalPages: 1,
  searchQuery: "",
  loading: false,
  error: null,
  clearError: () => set({ error: null }),
  getCampgrounds: async (page = 1, search = "") => {
    set({ loading: true, error: null });
    try {
      const data = await getCampgrounds(page, search);
      set({
        campgrounds: data.campgrounds ?? [],
        currentPage: data.currentPage ?? 1,
        totalPages: data.totalPages ?? 1,
        searchQuery: search,
        loading: false,
      });
    } catch (error: any) {
      const backendError = error.response?.data || { message: error.message };
      set({ error: backendError, loading: false });
    }
  },
  getCampgroundById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const data = await getCampgroundById(id);
      set({
        campground: data,
        loading: false,
      });
    } catch (error: any) {
      const backendError = error.response?.data || { message: error.message };
      set({ error: backendError, loading: false });
    }
  },
  addCampground: async (newCampground: any) => {
    set({ loading: true, error: null });
    try {
      const response = await createCampground(newCampground);
      const createdCampground = response.campground;
      set((state) => ({
        campgrounds: [...state.campgrounds, createdCampground],
        loading: false,
      }));
      return createdCampground;
    } catch (error: any) {
      const backendError = error.response?.data || { message: error.message };
      set({ error: backendError, loading: false });
      throw backendError;
    }
  },
  updateCampground: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const response = await updateCampground(id, payload);
      const updatedCampground = response.campground;
      set((state) => ({
        campground: updatedCampground,
        campgrounds: state.campgrounds.map((c) =>
          c._id === id ? updatedCampground : c,
        ),
        loading: false,
      }));
    } catch (error: any) {
      const backendError = error.response?.data || { message: error.message };
      set({ error: backendError, loading: false });
      throw backendError;
    }
  },
  deleteCampground: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteCampground(id);
      set((state) => ({
        campground: null,
        campgrounds: state.campgrounds.filter((camp) => camp._id !== id),
        loading: false,
      }));
    } catch (error: any) {
      const backendError = error.response?.data || { message: error.message };
      set({ error: backendError, loading: false });
      throw backendError;
    }
  },
  addReview: async (campgroundId, payload) => {
    set({ loading: true, error: null });
    try {
      const response = await createReview(campgroundId, payload);
      const newReview = response.review;
      set((state) => {
        if (!state.campground) return { loading: false };
        return {
          loading: false,
          error: null,
          campground: {
            ...state.campground,
            reviews: [...(state.campground.reviews || []), newReview],
          },
        };
      });
    } catch (error: any) {
      const backendError = error.response?.data || { message: error.message };
      set({ loading: false });
      throw backendError;
    }
  },
  deleteReview: async (campgroundId, reviewId) => {
    set({ loading: true, error: null });
    try {
      await deleteReview(campgroundId, reviewId);
      set((state) => {
        if (!state.campground) return { loading: false };
        return {
          loading: false,
          campground: {
            ...state.campground,
            reviews: (state.campground.reviews || []).filter(
              (r) => r._id !== reviewId,
            ),
          },
        };
      });
    } catch (error: any) {
      const backendError = error.response?.data || { message: error.message };
      set({ error: backendError, loading: false });
      throw backendError;
    }
  },
}));
