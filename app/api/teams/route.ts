import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/lib/models/Team';

export async function GET() {
  try {
    await dbConnect();
    const teams = await Team.find({}).sort({ hearts: -1 });
    
    return NextResponse.json({ 
      success: true, 
      data: teams 
    });
  } catch (error) {
    console.error('Teams API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const team = new Team(body);
    await team.save();
    
    return NextResponse.json({ 
      success: true, 
      data: team 
    });
  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create team' },
      { status: 500 }
    );
  }
}