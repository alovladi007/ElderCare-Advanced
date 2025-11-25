from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime
from sqlalchemy.orm import Session
import models
import hub_client

class AutomationEngine:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()

    def start(self, db: Session):
        """Start the automation engine"""
        self.scheduler.start()
        self.scheduler.add_job(
            self.check_time_automations,
            'cron',
            minute='*',
            args=[db]
        )
        print("✓ Automation Engine started")

    async def check_time_automations(self, db: Session):
        """Check and execute time-based automations"""
        now = datetime.now()
        current_time = now.strftime("%H:%M")

        automations = db.query(models.Automation).filter(
            models.Automation.enabled == True
        ).all()

        for automation in automations:
            for trigger in automation.triggers:
                if trigger.trigger_type == "time":
                    trigger_time = trigger.config.get("time")
                    if trigger_time == current_time:
                        await self.execute_automation(automation, db)

    async def execute_automation(self, automation: models.Automation, db: Session):
        """Execute an automation"""
        try:
            for action in automation.actions:
                if action.action_type == "device_command":
                    device_id = action.config.get("device_id")
                    command = action.config.get("command")
                    await hub_client.send_command(device_id, command)

                elif action.action_type == "scene_activate":
                    scene_id = action.config.get("scene_id")
                    scene = db.query(models.Scene).get(scene_id)
                    if scene:
                        for device_state in scene.device_states:
                            await hub_client.send_command(
                                device_state.device.device_id,
                                device_state.state
                            )

            automation.execution_count += 1
            automation.last_executed = datetime.utcnow()
            db.commit()

        except Exception as e:
            print(f"Error executing automation: {e}")

automation_engine = AutomationEngine()
