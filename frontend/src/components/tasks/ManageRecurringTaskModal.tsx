// ABOUTME: Modal for managing recurring tasks (edit pattern, stop, skip occurrences)
// ABOUTME: Allows editing recurrence rules and managing exceptions for recurring tasks

'use client';

import { useState, useEffect } from 'react';
import { Task, RecurrencePattern } from '@/types';
import { useTaskStore } from '@/lib/store/task-store';
import { useNotificationStore } from '@/lib/store/notification-store';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { format } from 'date-fns';

interface ManageRecurringTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export function ManageRecurringTaskModal({ isOpen, onClose, task }: ManageRecurringTaskModalProps) {
  const { updateTask } = useTaskStore();
  const { addNotification } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<'pattern' | 'exceptions'>('pattern');
  const [pattern, setPattern] = useState<RecurrencePattern | null>(null);
  const [skipDates, setSkipDates] = useState<string[]>([]);
  const [newSkipDate, setNewSkipDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task?.recurrence_pattern) {
      setPattern(task.recurrence_pattern);
    }
    if (task?.skip_dates) {
      setSkipDates(task.skip_dates);
    }
  }, [task]);

  if (!task || !task.is_recurring) return null;

  const handleSavePattern = async () => {
    if (!pattern) return;

    setIsSubmitting(true);
    try {
      await updateTask(task.task_id, {
        recurrence_pattern: pattern,
      });

      addNotification({
        type: 'success',
        title: 'Recurrence pattern updated',
        message: 'Changes will affect future task instances',
        duration: 4000,
      });

      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to update pattern',
        message: error instanceof Error ? error.message : 'Please try again',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopRecurrence = async () => {
    if (!confirm('Are you sure you want to stop this recurring task? No new instances will be created.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTask(task.task_id, {
        is_recurring: false,
        recurrence_pattern: undefined,
      });

      addNotification({
        type: 'success',
        title: 'Recurrence stopped',
        message: 'This task will no longer repeat',
        duration: 4000,
      });

      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to stop recurrence',
        message: error instanceof Error ? error.message : 'Please try again',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipNext = async () => {
    if (!task.next_occurrence) {
      addNotification({
        type: 'info',
        title: 'No next occurrence',
        message: 'There is no scheduled next occurrence to skip',
        duration: 3000,
      });
      return;
    }

    const nextDate = format(new Date(task.next_occurrence), 'yyyy-MM-dd');
    const updatedSkipDates = [...skipDates, nextDate];

    setIsSubmitting(true);
    try {
      await updateTask(task.task_id, {
        skip_dates: updatedSkipDates,
      });

      setSkipDates(updatedSkipDates);

      addNotification({
        type: 'success',
        title: 'Next occurrence skipped',
        message: `Task will not be created on ${format(new Date(task.next_occurrence), 'MMM d, yyyy')}`,
        duration: 4000,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to skip occurrence',
        message: error instanceof Error ? error.message : 'Please try again',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSkipDate = async () => {
    if (!newSkipDate) return;

    if (skipDates.includes(newSkipDate)) {
      addNotification({
        type: 'info',
        title: 'Date already skipped',
        message: 'This date is already in the skip list',
        duration: 3000,
      });
      return;
    }

    const updatedSkipDates = [...skipDates, newSkipDate].sort();

    setIsSubmitting(true);
    try {
      await updateTask(task.task_id, {
        skip_dates: updatedSkipDates,
      });

      setSkipDates(updatedSkipDates);
      setNewSkipDate('');

      addNotification({
        type: 'success',
        title: 'Skip date added',
        message: `Task will not be created on ${format(new Date(newSkipDate), 'MMM d, yyyy')}`,
        duration: 3000,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to add skip date',
        message: error instanceof Error ? error.message : 'Please try again',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveSkipDate = async (dateToRemove: string) => {
    const updatedSkipDates = skipDates.filter(d => d !== dateToRemove);

    setIsSubmitting(true);
    try {
      await updateTask(task.task_id, {
        skip_dates: updatedSkipDates,
      });

      setSkipDates(updatedSkipDates);

      addNotification({
        type: 'success',
        title: 'Skip date removed',
        message: 'Date removed from skip list',
        duration: 3000,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to remove skip date',
        message: error instanceof Error ? error.message : 'Please try again',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDayOfWeek = (day: number) => {
    if (!pattern) return;

    const daysOfWeek = pattern.daysOfWeek || [];
    setPattern({
      ...pattern,
      daysOfWeek: daysOfWeek.includes(day)
        ? daysOfWeek.filter(d => d !== day)
        : [...daysOfWeek, day].sort(),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Recurring Task" size="lg">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-medium text-slate-900 mb-1">{task.title}</h3>
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            <span>
              Frequency: <span className="font-medium capitalize">{pattern?.frequency}</span>
            </span>
            {task.next_occurrence && (
              <span>
                Next: <span className="font-medium">{format(new Date(task.next_occurrence), 'MMM d, yyyy')}</span>
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('pattern')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pattern'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Recurrence Pattern
            </button>
            <button
              onClick={() => setActiveTab('exceptions')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'exceptions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Skip Exceptions
            </button>
          </nav>
        </div>

        {/* Pattern Tab */}
        {activeTab === 'pattern' && pattern && (
          <div className="space-y-4">
            {/* Frequency and Interval */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequency" className="text-slate-900">Frequency</Label>
                <select
                  id="frequency"
                  value={pattern.frequency}
                  onChange={(e) => setPattern({ ...pattern, frequency: e.target.value as any })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <Label htmlFor="interval" className="text-slate-900">Every</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="interval"
                    type="number"
                    min="1"
                    max="99"
                    value={pattern.interval}
                    onChange={(e) => setPattern({ ...pattern, interval: parseInt(e.target.value) || 1 })}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white"
                  />
                  <span className="text-sm text-slate-600">
                    {pattern.frequency === 'daily' && 'day(s)'}
                    {pattern.frequency === 'weekly' && 'week(s)'}
                    {pattern.frequency === 'monthly' && 'month(s)'}
                    {pattern.frequency === 'yearly' && 'year(s)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Days of Week (Weekly only) */}
            {pattern.frequency === 'weekly' && (
              <div>
                <Label className="text-slate-900">Repeat on</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDayOfWeek(index)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        (pattern.daysOfWeek || []).includes(index)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleStopRecurrence}
                disabled={isSubmitting}
                className="text-red-600 hover:bg-red-50 border-red-200"
              >
                Stop Recurrence
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSavePattern}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Pattern'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Exceptions Tab */}
        {activeTab === 'exceptions' && (
          <div className="space-y-4">
            {/* Skip Next Occurrence */}
            {task.next_occurrence && (
              <div className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Skip Next Occurrence</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Next scheduled: {format(new Date(task.next_occurrence), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSkipNext}
                    disabled={isSubmitting}
                  >
                    Skip Next
                  </Button>
                </div>
              </div>
            )}

            {/* Add Skip Date */}
            <div className="p-4 border border-slate-200 rounded-lg">
              <Label className="text-slate-900 mb-2 block">Add Skip Date</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={newSkipDate}
                  onChange={(e) => setNewSkipDate(e.target.value)}
                  className="flex-1 bg-white text-slate-900 border-slate-300"
                />
                <Button
                  type="button"
                  onClick={handleAddSkipDate}
                  disabled={!newSkipDate || isSubmitting}
                  size="sm"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Skip Dates List */}
            <div>
              <Label className="text-slate-900 mb-2 block">Skipped Dates ({skipDates.length})</Label>
              {skipDates.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3">
                  {skipDates.sort().reverse().map((date) => (
                    <div
                      key={date}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-sm text-slate-900">
                        {format(new Date(date), 'MMM d, yyyy')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkipDate(date)}
                        disabled={isSubmitting}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm border border-slate-200 rounded-lg">
                  No skipped dates
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
