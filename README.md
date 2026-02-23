ShortlistAI

Full-Stack AI-Powered CV Screening System

# Overview

ShortlistAI is a full-stack recruitment screening platform designed to analyse and rank candidate CVs against job descriptions using AI.

This project was built as an end-to-end production-style system to demonstrate backend architecture, frontend integration, AI-assisted decision logic, and product-focused design.

The system enables recruiters to upload candidate CVs, analyse them against structured role criteria, and receive ranked shortlists with transparent scoring.

# Key Features

Secure JWT-based authentication

Persistent user sessions

Role-based screening workflows

Multi-file CV upload with progress tracking

AI-powered CV analysis and ranking

Weighted scoring (Essential vs Core vs Desirable criteria)

Recruiter-facing structured summaries

AI Confidence Indicator (High / Medium / Low)

Downloadable ranked shortlists (CSV export)

Screening history with search functionality

# Scoring Philosophy

ShortlistAI uses a tiered weighting model:

Essential criteria → Highest weight

Core responsibilities → Moderate weight

Desirable criteria → Bonus weight only

Desirable criteria do not significantly penalise candidates.
This reflects realistic recruiter decision-making rather than naive keyword matching.

The system also generates an AI confidence level to increase transparency in ranking decisions.

# Tech Stack

# Frontend

React

TypeScript

Tailwind CSS

# Backend

Python

FastAPI

JWT Authentication

# Database

PostgreSQL

# AI Integration

LLM-based CV analysis

Structured scoring and recruiter summary generation

Deployment-ready architecture with API-based separation between frontend and backend.

# System Architecture (High-Level)

User → Frontend (React)
→ Authenticated API Request
→ Backend (FastAPI)
→ File Parsing & Validation
→ AI Processing
→ Weighted Scoring Logic
→ Database Persistence
→ Structured Response
→ Ranked Results UI

Example Workflow

User logs in

Creates or selects a role

Uploads candidate CVs

System processes files and calls AI

Candidates are scored and ranked

Recruiter reviews results and exports shortlist

# Design Principles

Transparency over “black-box” AI

Clear distinction between required and desirable criteria

Recruiter-friendly summaries

Production-style authentication and data persistence

Practical usability over feature bloat

# What This Project Demonstrates

Full-stack system design

REST API development

JWT authentication and session management

File upload handling and async processing

AI integration into real workflows

Weighted scoring calibration

Product-focused UX refinement

# Future Improvements

Role template management

Enhanced analytics dashboard

Multi-tenant organisation support

Audit trail logging

Performance optimisation for large file batches

# Disclaimer

This system is designed as a decision-support tool.
Final hiring decisions should always involve human review.
