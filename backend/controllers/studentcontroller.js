import prisma from '../config/prisma.js';

const getDashboardData = async (req, res) => {
  try {
    const studentId = req.user.id;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        group: true,
        course: {
          include: {
            units: {
              include: {
                lessons: true
              }
            }
          }
        },
        progress: {
          include: {
            unit: true,
            lessons: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Calculate overall progress
    const totalUnits = student.course.units.length;
    const completedUnits = student.progress.filter(p => p.completion === 100).length;
    const overallProgress = totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0;

    // Get pending assignments
    const pendingAssignments = await prisma.resource.count({
      where: {
        unitId: { in: student.course.units.map(u => u.id) },
        type: 'ASSIGNMENT',
        submissions: {
          none: {
            studentId: studentId
          }
        }
      }
    });

    // Format response
    const dashboardData = {
      student: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        group: student.group.groupCode,
        course: student.course.courseCode,
        type: student.type,
        status: student.status
      },
      progress: {
        overall: overallProgress,
        byUnit: student.progress.map(p => ({
          unitId: p.unitId,
          unitCode: p.unit.unitCode,
          unitName: p.unit.unitName,
          completion: p.completion
        }))
      },
      assignments: {
        pending: pendingAssignments,
        total: student.course.units.reduce((acc, unit) => 
          acc + unit.lessons.filter(l => l.type === 'ASSIGNMENT').length, 0)
      }
    };

    res.json(dashboardData);

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

const getStudentCourses = async (req, res) => {
  try {
    const studentId = req.user.id;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        course: {
          include: {
            units: {
              include: {
                lessons: {
                  where: {
                    enabled: true
                  },
                  orderBy: {
                    order: 'asc'
                  }
                }
              }
            }
          }
        },
        progress: {
          include: {
            lessons: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Map units with progress
    const unitsWithProgress = student.course.units.map(unit => {
      const unitProgress = student.progress.find(p => p.unitId === unit.id) || {};
      
      return {
        id: unit.id,
        unitCode: unit.unitCode,
        unitName: unit.unitName,
        term: unit.term,
        nature: unit.nature,
        completion: unitProgress.completion || 0,
        lessons: unit.lessons.map(lesson => {
          const lessonProgress = unitProgress.lessons?.find(l => l.lessonId === lesson.id);
          
          return {
            id: lesson.id,
            title: lesson.title,
            order: lesson.order,
            status: lessonProgress?.status || 'NOT_STARTED',
            completedAt: lessonProgress?.completedAt
          };
        })
      };
    });

    res.json({
      course: {
        id: student.course.id,
        courseCode: student.course.courseCode,
        title: student.course.title,
        type: student.course.type
      },
      units: unitsWithProgress
    });

  } catch (error) {
    console.error('Courses error:', error);
    res.status(500).json({ error: 'Failed to load courses' });
  }
};

const getLessonDetails = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { lessonId } = req.params;

    // Verify student has access to this lesson
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        unit: {
          include: {
            course: {
              include: {
                groups: {
                  where: {
                    students: {
                      some: { id: studentId }
                    }
                  }
                }
              }
            }
          }
        },
        resources: true
      }
    });

    if (!lesson || lesson.unit.course.groups.length === 0) {
      return res.status(404).json({ error: 'Lesson not found or access denied' });
    }

    // Get student's progress for this lesson
    const progress = await prisma.progress.findFirst({
      where: {
        studentId,
        unitId: lesson.unitId
      },
      include: {
        lessons: {
          where: { lessonId }
        }
      }
    });

    res.json({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        status: progress?.lessons[0]?.status || 'NOT_STARTED'
      },
      resources: lesson.resources
    });

  } catch (error) {
    console.error('Lesson error:', error);
    res.status(500).json({ error: 'Failed to load lesson' });
  }
};

export default { 
  getDashboardData, 
  getStudentCourses, 
  getLessonDetails 
};