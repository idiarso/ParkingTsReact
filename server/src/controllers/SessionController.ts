import { emitSessionUpdate } from '../socket';

// In create session method
await sessionRepository.save(newSession);
emitSessionUpdate();

// In update session method
await sessionRepository.save(session);
emitSessionUpdate();

// In end session method
await sessionRepository.save(session);
emitSessionUpdate(); 